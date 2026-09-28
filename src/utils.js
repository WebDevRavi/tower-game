import * as constant from './constant'

export const checkMoveDown = engine =>
  (engine.checkTimeMovement(constant.moveDownMovement))

export const getMoveDownValue = (engine, store) => {
  const pixelsPerFrame = store ? store.pixelsPerFrame : engine.pixelsPerFrame.bind(engine)
  const successCount = engine.getVariable(constant.successCount)
  const calHeight = engine.getVariable(constant.blockHeight) * 2
  if (successCount <= 4) {
    return pixelsPerFrame(calHeight * 1.25)
  }
  return pixelsPerFrame(calHeight)
}

export const getAngleBase = (engine) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { hookAngle } = engine.getVariable(constant.gameUserOption)
  if (hookAngle) {
    return hookAngle(successCount, gameScore)
  }
  if (engine.getVariable(constant.hardMode)) {
    return 90
  }
  switch (true) {
    case successCount < 10:
      return 30
    case successCount < 20:
      return 60
    default:
      return 80
  }
}

export const getSwingBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { hookSpeed } = engine.getVariable(constant.gameUserOption)
  if (hookSpeed) {
    return hookSpeed(successCount, gameScore)
  }
  let hard
  switch (true) {
    case successCount < 1:
      hard = 0
      break
    case successCount < 10:
      hard = 1
      break
    case successCount < 20:
      hard = 0.8
      break
    case successCount < 30:
      hard = 0.7
      break
    default:
      hard = 0.74
      break
  }
  if (engine.getVariable(constant.hardMode)) {
    hard = 1.1
  }
  return Math.sin(time / (200 / hard))
}

export const getLandBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { landBlockSpeed } = engine.getVariable(constant.gameUserOption)
  if (landBlockSpeed) {
    return landBlockSpeed(successCount, gameScore)
  }
  const { width } = engine
  let hard
  switch (true) {
    case successCount < 5:
      hard = 0
      break
    case successCount < 13:
      hard = 0.001
      break
    case successCount < 23:
      hard = 0.002
      break
    default:
      hard = 0.003
      break
  }
  return Math.cos(time / 200) * hard * width
}

export const getHookStatus = (engine) => {
  if (engine.checkTimeMovement(constant.hookDownMovement)) {
    return constant.hookDown
  }
  if (engine.checkTimeMovement(constant.hookUpMovement)) {
    return constant.hookUp
  }
  return constant.hookNormal
}

export const touchEventHandler = (engine) => {
  if (!engine.getVariable(constant.gameStartNow)) return
  if (engine.paused) {
    return
  }
  if (getHookStatus(engine) !== constant.hookNormal) {
    return
  }
  try {
    localStorage.setItem('blue3d_tower_tutorial_seen', 'true')
  } catch (e) {}
  engine.removeInstance('tutorial')
  engine.removeInstance('tutorial-arrow')
  const b = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (b && b.status === constant.swing) {
    engine.setTimeMovement(constant.hookUpMovement, 500)
    b.status = constant.beforeDrop
  }
}

export const addSuccessCount = (engine) => {
  const { setGameSuccess } = engine.getVariable(constant.gameUserOption)
  const lastSuccessCount = engine.getVariable(constant.successCount)
  const success = lastSuccessCount + 1
  engine.setVariable(constant.successCount, success)
  engine.setVariable('FLOOR_PULSE_TIME', engine.utils.getCurrentTime())
  if (engine.getVariable(constant.hardMode)) {
    engine.setVariable(constant.ropeHeight, engine.height * engine.utils.random(0.35, 0.55))
  }
  if (setGameSuccess) setGameSuccess(success)
}

export const addFailedCount = (engine) => {
  const { setGameFailed } = engine.getVariable(constant.gameUserOption)
  const lastFailedCount = engine.getVariable(constant.failedCount, 0)
  const failed = lastFailedCount + 1
  engine.setVariable(constant.failedCount, failed)
  engine.setVariable(constant.perfectCount, 0)
  engine.setVariable('COMBO_COUNT', 0)
  engine.setVariable('LIFE_LOST_TIME', engine.utils.getCurrentTime())
  engine.setVariable('LAST_LOST_HEART_INDEX', failed)
  if (engine.triggerMiss) {
    engine.triggerMiss(failed)
  }
  if (setGameFailed) setGameFailed(failed)
  if (failed >= 3) {
    engine.pauseAudio('bgm')
    engine.playAudio('game-over')
    engine.setVariable(constant.gameStartNow, false)
  }
}

export const addScore = (engine, isPerfect) => {
  const {
    setGameScore, successScore, perfectScore, highScore = 0
  } = engine.getVariable(constant.gameUserOption)
  const lastPerfectCount = engine.getVariable(constant.perfectCount, 0)
  const lastGameScore = engine.getVariable(constant.gameScore, 0)
  const lastComboCount = engine.getVariable('COMBO_COUNT', 0)
  const combo = lastComboCount + 1
  engine.setVariable('COMBO_COUNT', combo)

  const perfect = isPerfect ? lastPerfectCount + 1 : 0
  const score = lastGameScore + (successScore || 25) + ((perfectScore || 25) * perfect)
  engine.setVariable(constant.gameScore, score)
  engine.setVariable(constant.perfectCount, perfect)
  engine.setVariable('SCORE_PULSE_TIME', engine.utils.getCurrentTime())

  const currentHighScore = engine.getVariable('GAME_HIGH_SCORE', highScore)
  if (currentHighScore > 0 && score > currentHighScore && !engine.getVariable('NEW_BEST_NOTIFIED')) {
    engine.setVariable('NEW_BEST_NOTIFIED', true)
    engine.setVariable('NEW_BEST_TIME', engine.utils.getCurrentTime())
  }

  if (isPerfect) {
    const text = perfect > 1 ? `PERFECT x${perfect}!` : (combo >= 2 ? `PERFECT! COMBO ×${combo}` : 'PERFECT!')
    engine.setVariable('PERFECT_FEEDBACK_TIME', engine.utils.getCurrentTime())
    engine.setVariable('PERFECT_FEEDBACK_TEXT', text)
  } else if (combo >= 2) {
    engine.setVariable('PERFECT_FEEDBACK_TIME', engine.utils.getCurrentTime())
    engine.setVariable('PERFECT_FEEDBACK_TEXT', `COMBO ×${combo}`)
  }

  if (setGameScore) setGameScore(score, isPerfect, perfect)
}

export const drawYellowString = (engine, option) => {
  const {
    string, size, x, y, textAlign, fontName = 'wenxue', fontWeight = 'normal',
    glowColor = null, glowBlur = 0
  } = option
  const { ctx } = engine
  const fontSize = size
  const lineSize = fontSize * 0.1
  ctx.save()
  ctx.beginPath()
  if (glowColor && glowBlur > 0) {
    ctx.shadowColor = glowColor
    ctx.shadowBlur = glowBlur
  }
  const gradient = ctx.createLinearGradient(0, y - fontSize, 0, y)
  gradient.addColorStop(0, '#FAD961')
  gradient.addColorStop(1, '#F76B1C')
  ctx.fillStyle = gradient
  ctx.lineWidth = lineSize
  ctx.strokeStyle = '#FFF'
  ctx.textAlign = textAlign || 'center'
  ctx.font = `${fontWeight} ${fontSize}px ${fontName}`
  ctx.strokeText(string, x, y)
  ctx.fillText(string, x, y)
  ctx.restore()
}
