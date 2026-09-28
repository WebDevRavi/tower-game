import { Instance } from 'cooljs'
import { blockAction, blockPainter } from './block'
import {
  checkMoveDown,
  getMoveDownValue,
  drawYellowString,
  getAngleBase
} from './utils'
import { addFlight } from './flight'
import * as constant from './constant'

export const endAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return
  const successCount = engine.getVariable(constant.successCount, 0)
  const failedCount = engine.getVariable(constant.failedCount, 0)
  const gameScore = engine.getVariable(constant.gameScore, 0)
  const countDigits = String(successCount).length
  const threeFiguresOffset = Math.max(0, countDigits - 2) * (engine.width * 0.08)

  // 1. Floor Progression Animation
  const floorPulseTime = engine.getVariable('FLOOR_PULSE_TIME', 0)
  let floorScale = 1.0
  let floorGlowAlpha = 0
  if (floorPulseTime) {
    const elapsed = engine.utils.getCurrentTime() - floorPulseTime
    if (elapsed < 320) {
      const p = elapsed / 320
      floorScale = 1 + (0.20 * Math.sin(p * Math.PI))
      floorGlowAlpha = Math.sin(p * Math.PI)
    }
  }

  drawYellowString(engine, {
    string: 'floor',
    size: engine.width * 0.06,
    x: (engine.width * 0.24) + threeFiguresOffset,
    y: engine.width * 0.12,
    textAlign: 'left',
    fontName: 'Arial',
    fontWeight: 'bold'
  })
  drawYellowString(engine, {
    string: successCount,
    size: engine.width * 0.17 * floorScale,
    x: (engine.width * 0.22) + threeFiguresOffset,
    y: engine.width * 0.2,
    textAlign: 'right',
    glowColor: floorGlowAlpha > 0 ? `rgba(255, 230, 0, ${0.5 * floorGlowAlpha})` : null,
    glowBlur: floorGlowAlpha > 0 ? (12 * floorGlowAlpha) : 0
  })

  // 2. Score UI & Pop Animation
  const score = engine.getImg('score')
  const scoreWidth = score.width
  const scoreHeight = score.height
  const zoomedWidth = engine.width * 0.35
  const zoomedHeight = (scoreHeight * zoomedWidth) / scoreWidth
  engine.ctx.drawImage(
    score,
    engine.width * 0.61,
    engine.width * 0.038,
    zoomedWidth,
    zoomedHeight
  )

  const scorePulseTime = engine.getVariable('SCORE_PULSE_TIME', 0)
  let scoreScale = 1.0
  if (scorePulseTime) {
    const elapsed = engine.utils.getCurrentTime() - scorePulseTime
    if (elapsed < 280) {
      const p = elapsed / 280
      scoreScale = 1 + (0.18 * Math.sin(p * Math.PI))
    }
  }

  drawYellowString(engine, {
    string: gameScore,
    size: engine.width * 0.06 * scoreScale,
    x: engine.width * 0.9,
    y: engine.width * 0.11,
    textAlign: 'right'
  })

  // Temporary NEW BEST! notification under score badge
  const newBestTime = engine.getVariable('NEW_BEST_TIME', 0)
  if (newBestTime) {
    const elapsed = engine.utils.getCurrentTime() - newBestTime
    if (elapsed < 1600) {
      const p = elapsed / 1600
      let alpha = 1
      if (p < 0.15) alpha = p / 0.15
      else if (p > 0.75) alpha = (1 - p) / 0.25
      const floatY = (engine.width * 0.15) + (Math.sin(p * Math.PI) * 2)
      const { ctx } = engine
      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
      drawYellowString(engine, {
        string: 'NEW BEST!',
        size: engine.width * 0.038,
        x: engine.width * 0.78,
        y: floatY,
        textAlign: 'center',
        fontWeight: 'bold',
        glowColor: 'rgba(255, 215, 0, 0.6)',
        glowBlur: 6
      })
      ctx.restore()
    }
  }

  // 3. Animated Heart / Life Feedback
  const { ctx } = engine
  const heart = engine.getImg('heart')
  const heartWidth = heart.width
  const heartHeight = heart.height
  const zoomedHeartWidth = engine.width * 0.08
  const zoomedHeartHeight = (heartHeight * zoomedHeartWidth) / heartWidth
  const lifeLostTime = engine.getVariable('LIFE_LOST_TIME', 0)
  const lastLostIndex = engine.getVariable('LAST_LOST_HEART_INDEX', 0)

  for (let i = 1; i <= 3; i += 1) {
    ctx.save()
    let alpha = 1.0
    let offsetX = 0
    let offsetY = 0
    let heartScale = 1.0

    if (i === lastLostIndex && lifeLostTime) {
      const elapsed = engine.utils.getCurrentTime() - lifeLostTime
      if (elapsed < 400) {
        const p = elapsed / 400
        offsetX = Math.sin(elapsed / 20) * 3 * (1 - p)
        heartScale = 1 + (0.22 * Math.sin(p * Math.PI))
        alpha = 1.0 - (0.8 * p)
      } else {
        alpha = 0.2
      }
    } else if (i <= failedCount) {
      alpha = 0.2
    }

    ctx.globalAlpha = Math.max(0.15, Math.min(1, alpha))
    const baseHeartX = (engine.width * 0.66) + ((i - 1) * zoomedHeartWidth)
    const baseHeartY = engine.width * 0.16
    const curW = zoomedHeartWidth * heartScale
    const curH = zoomedHeartHeight * heartScale
    const drawX = baseHeartX + offsetX - ((curW - zoomedHeartWidth) / 2)
    const drawY = baseHeartY + offsetY - ((curH - zoomedHeartHeight) / 2)
    ctx.drawImage(heart, drawX, drawY, curW, curH)
    ctx.restore()
  }

  // 4. Floating Combo & Perfect Feedback
  const feedbackTime = engine.getVariable('PERFECT_FEEDBACK_TIME', 0)
  const feedbackText = engine.getVariable('PERFECT_FEEDBACK_TEXT', '')
  if (feedbackText && feedbackTime) {
    const elapsed = engine.utils.getCurrentTime() - feedbackTime
    if (elapsed < 900) {
      const progress = elapsed / 900
      const alpha = 1 - Math.pow(progress, 2)
      let scale = 1.0
      if (progress < 0.2) {
        scale = 0.8 + (progress / 0.2) * 0.3
      } else if (progress < 0.4) {
        scale = 1.1 - ((progress - 0.2) / 0.2) * 0.1
      }
      const floatY = (engine.height * 0.38) - (progress * engine.height * 0.08)
      ctx.save()
      ctx.globalAlpha = Math.max(0, alpha)
      drawYellowString(engine, {
        string: feedbackText,
        size: engine.width * 0.075 * scale,
        x: engine.calWidth,
        y: floatY,
        textAlign: 'center',
        fontWeight: 'bold',
        glowColor: 'rgba(255, 230, 0, 0.4)',
        glowBlur: 8
      })
      ctx.restore()
    }
  }
}

export const startAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return
  const lastBlock = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (!lastBlock || [constant.land, constant.out].indexOf(lastBlock.status) > -1) {
    if (checkMoveDown(engine) && getMoveDownValue(engine)) return
    if (engine.checkTimeMovement(constant.hookUpMovement)) return
    const angleBase = getAngleBase(engine)
    const initialAngle = (Math.PI
        * engine.utils.random(angleBase, angleBase + 5)
        * engine.utils.randomPositiveNegative()
    ) / 180
    engine.setVariable(constant.blockCount, engine.getVariable(constant.blockCount) + 1)
    engine.setVariable(constant.initialAngle, initialAngle)
    engine.setTimeMovement(constant.hookDownMovement, 500)
    const block = new Instance({
      name: `block_${engine.getVariable(constant.blockCount)}`,
      action: blockAction,
      painter: blockPainter
    })
    engine.addInstance(block)
  }
  const successCount = Number(engine.getVariable(constant.successCount, 0))
  switch (successCount) {
    case 2:
      addFlight(engine, 1, 'leftToRight')
      break
    case 6:
      addFlight(engine, 2, 'rightToLeft')
      break
    case 8:
      addFlight(engine, 3, 'leftToRight')
      break
    case 14:
      addFlight(engine, 4, 'bottomToTop')
      break
    case 18:
      addFlight(engine, 5, 'bottomToTop')
      break
    case 22:
      addFlight(engine, 6, 'bottomToTop')
      break
    case 25:
      addFlight(engine, 7, 'rightTopToLeft')
      break
    default:
      break
  }
}

