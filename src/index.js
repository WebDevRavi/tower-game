import { Engine, Instance } from 'cooljs'
import { touchEventHandler } from './utils'
import { background } from './background'
import { lineAction, linePainter } from './line'
import { cloudAction, cloudPainter } from './cloud'
import { hookAction, hookPainter } from './hook'
import { tutorialAction, tutorialPainter } from './tutorial'
import * as constant from './constant'
import { startAnimate, endAnimate } from './animateFuncs'

window.TowerGame = (option = {}) => {
  const {
    width,
    height,
    canvasId,
    soundOn
  } = option
  const game = new Engine({
    canvasId,
    highResolution: true,
    width,
    height,
    soundOn: true // Always load audio assets into memory so they can be unmuted at any time
  })
  game.soundOn = option.soundOn !== false
  const pathGenerator = (path) => `./assets/${path}`

  // Resilient retry fallback: if ./assets/ fails, fallback to root ./
  const origAddImg = game.addImg.bind(game)
  game.addImg = (name, src, retry = 0) => {
    let resolvedSrc = src
    if (retry > 0 && typeof src === 'string' && src.indexOf('./assets/') === 0) {
      resolvedSrc = src.replace('./assets/', './')
    }
    origAddImg(name, resolvedSrc, retry)
  }

  const origAddAudio = game.addAudio.bind(game)
  game.addAudio = (name, src, retry = 0) => {
    let resolvedSrc = src
    if (retry > 0 && typeof src === 'string' && src.indexOf('./assets/') === 0) {
      resolvedSrc = src.replace('./assets/', './')
    }
    origAddAudio(name, resolvedSrc, retry)
  }

  game.addImg('background', pathGenerator('background.png'))
  game.addImg('hook', pathGenerator('hook.png'))
  game.addImg('blockRope', pathGenerator('block-rope.png'))
  game.addImg('block', pathGenerator('block.png'))
  game.addImg('block-perfect', pathGenerator('block-perfect.png'))
  for (let i = 1; i <= 8; i += 1) {
    game.addImg(`c${i}`, pathGenerator(`c${i}.png`))
  }
  game.addLayer(constant.flightLayer)
  for (let i = 1; i <= 7; i += 1) {
    game.addImg(`f${i}`, pathGenerator(`f${i}.png`))
  }
  game.swapLayer(0, 1)
  game.addImg('tutorial', pathGenerator('tutorial.png'))
  game.addImg('tutorial-arrow', pathGenerator('tutorial-arrow.png'))
  game.addImg('heart', pathGenerator('heart.png'))
  game.addImg('score', pathGenerator('score.png'))
  game.addAudio('drop-perfect', pathGenerator('drop-perfect.mp3'))
  game.addAudio('drop', pathGenerator('drop.mp3'))
  game.addAudio('game-over', pathGenerator('game-over.mp3'))
  game.addAudio('rotate', pathGenerator('rotate.mp3'))
  game.addAudio('bgm', pathGenerator('bgm.mp3'))
  game.addAudio('tap', pathGenerator('tap.wav'))
  game.setVariable(constant.blockWidth, game.width * 0.25)
  game.setVariable(constant.blockHeight, game.getVariable(constant.blockWidth) * 0.71)
  game.setVariable(constant.cloudSize, game.width * 0.3)
  game.setVariable(constant.ropeHeight, game.height * 0.4)
  game.setVariable(constant.blockCount, 0)
  game.setVariable(constant.successCount, 0)
  game.setVariable(constant.failedCount, 0)
  game.setVariable(constant.gameScore, 0)
  game.setVariable(constant.hardMode, false)
  game.setVariable(constant.gameUserOption, option)
  game.setVariable('GAME_HIGH_SCORE', option.highScore || 0)
  for (let i = 1; i <= 4; i += 1) {
    const cloud = new Instance({
      name: `cloud_${i}`,
      action: cloudAction,
      painter: cloudPainter
    })
    cloud.index = i
    cloud.count = 5 - i
    game.addInstance(cloud)
  }
  const line = new Instance({
    name: 'line',
    action: lineAction,
    painter: linePainter
  })
  game.addInstance(line)
  const hook = new Instance({
    name: 'hook',
    action: hookAction,
    painter: hookPainter
  })
  game.addInstance(hook)

  game.startAnimate = startAnimate
  game.endAnimate = endAnimate
  game.paintUnderInstance = background
  game.addKeyDownListener('enter', () => {
    touchEventHandler(game)
  })
  game.addKeyDownListener('space', () => {
    touchEventHandler(game)
  })
  game.touchStartListener = (e) => {
    if (e && e.target && typeof e.target.closest === 'function') {
      if (e.target.closest('#game-hud, .game-hud, .hud-btn, .modal, .landing, button, a, [role="button"]')) {
        return
      }
    }
    touchEventHandler(game)
  }

  // Resilient asset loading wrapper with automatic watchdog
  const originalLoad = game.load.bind(game)
  game.load = (onload, loading) => {
    let finished = false
    const safeOnload = () => {
      if (finished) return
      finished = true
      if (onload) onload()
    }
    const safeLoading = (status) => {
      if (loading) loading(status)
      if (status && status.total > 0 && (status.success + status.failed >= status.total)) {
        safeOnload()
      }
    }
    originalLoad(safeOnload, safeLoading)
    setTimeout(() => {
      safeOnload()
    }, 2000)
  }

  // Safe audio playback wrapping to catch browser autoplay rejections
  const originalPlayAudio = game.playAudio.bind(game)
  game.playAudio = (name, loop = false) => {
    if (!game.soundOn) return
    try {
      const a = game.getAudio(name)
      if (a) {
        if (loop) {
          a.loop = true
        }
        const p = a.play()
        if (p && typeof p.catch === 'function') {
          p.catch(() => {})
        }
        if (loop && !a._hasLoopListener) {
          a._hasLoopListener = true
          a.addEventListener('ended', () => {
            a.currentTime = 0
            const p2 = a.play()
            if (p2 && typeof p2.catch === 'function') {
              p2.catch(() => {})
            }
          }, false)
        }
      }
    } catch (err) {}
  }

  // Refresh-rate independent FPS clamping (60Hz, 120Hz, 144Hz, 165Hz, 240Hz)
  game.updateFps = (time) => {
    if (game.lastTime === 0) {
      game.fps = 60
    } else {
      const delta = time - game.lastTime
      if (delta <= 0) {
        game.fps = game.fps || 60
      } else {
        const measuredFps = 1000 / delta
        game.fps = Math.max(15, Math.min(measuredFps, 240))
      }
    }
  }

  game.playBgm = () => {
    if (game.soundOn) {
      game.playAudio('bgm', true)
    }
  }

  game.pauseBgm = () => {
    game.pauseAudio('bgm')
  }

  game.setSound = (on) => {
    game.soundOn = on
    if (!on) {
      game.pauseBgm()
      if (game.assetsObj && game.assetsObj.audio) {
        Object.keys(game.assetsObj.audio).forEach((key) => {
          try {
            game.assetsObj.audio[key].pause()
          } catch (e) {}
        })
      }
    } else {
      if (!game.paused) {
        game.playBgm()
      }
    }
  }

  game.pause = () => {
    if (game.paused) return
    game.paused = true
    game.lastPausedAt = game.utils.getCurrentTime()
    game.pauseBgm()
  }

  game.resume = () => {
    if (!game.paused) return
    game.paused = false
    if (game.lastPausedAt) {
      game.pausedTime += (game.utils.getCurrentTime() - game.lastPausedAt)
      game.lastPausedAt = 0
    }
    if (game.soundOn) {
      game.playBgm()
    }
  }

  game.triggerShake = (isPerfect) => {
    if (option.onShake) {
      option.onShake(isPerfect)
    }
  }

  game.triggerMiss = (failedCount) => {
    if (option.onMiss) {
      option.onMiss(failedCount)
    }
  }

  game.triggerTumble = () => {
    if (option.onTumble) {
      option.onTumble()
    }
  }

  game.reset = () => {
    // 1. Remove all block instances and tutorial from default layer
    const defaultInstances = game.instancesObj[game.defaultLayer] || []
    game.instancesObj[game.defaultLayer] = defaultInstances.filter((inst) => {
      return !inst.name.startsWith('block_') && inst.name !== 'tutorial' && inst.name !== 'tutorial-arrow'
    })

    // 2. Remove all flight instances
    game.instancesObj[constant.flightLayer] = []

    // 3. Clear reactions
    game.instancesReactionArr = game.instancesReactionArr.filter((inst) => {
      return !inst.name.startsWith('block_')
    })

    // 4. Reset variables
    game.setVariable(constant.blockCount, 0)
    game.setVariable(constant.successCount, 0)
    game.setVariable(constant.failedCount, 0)
    game.setVariable(constant.gameScore, 0)
    game.setVariable(constant.hardMode, false)
    game.setVariable(constant.flightCount, 0)
    game.setVariable(constant.perfectCount, 0)
    game.setVariable(constant.gameStartNow, false)
    game.setVariable(constant.bgLinearGradientOffset, 0)
    game.setVariable('PERFECT_FEEDBACK_TIME', 0)
    game.setVariable('PERFECT_FEEDBACK_TEXT', '')
    game.setVariable('COMBO_COUNT', 0)
    game.setVariable('NEW_BEST_NOTIFIED', false)
    game.setVariable('NEW_BEST_TIME', 0)
    game.setVariable('SCORE_PULSE_TIME', 0)
    game.setVariable('FLOOR_PULSE_TIME', 0)
    game.setVariable('LIFE_LOST_TIME', 0)
    game.setVariable('LAST_LOST_HEART_INDEX', 0)

    // 5. Reset line
    const line = game.getInstance('line')
    if (line) {
      line.ready = false
      line.x = 0
      line.y = game.getVariable(constant.lineInitialOffset)
      line.collisionX = game.width - game.getVariable(constant.blockWidth)
    }

    // 6. Reset hook
    const hook = game.getInstance('hook')
    if (hook) {
      hook.ready = false
      hook.x = game.width / 2
      hook.y = game.getVariable(constant.ropeHeight) * -1.5
    }

    // 7. Reset clouds
    for (let i = 1; i <= 4; i += 1) {
      const cloud = game.getInstance(`cloud_${i}`)
      if (cloud) {
        cloud.ready = false
        cloud.count = 5 - i
      }
    }

    // 8. Reset background offset
    const bg = game.getImg('background')
    if (bg) {
      const zoomedHeight = (bg.height * game.width) / bg.width
      game.setVariable(constant.bgImgOffset, game.height - zoomedHeight)
      game.setVariable(constant.lineInitialOffset, game.height - (zoomedHeight * 0.394))
    }

    // 9. Clear tweens
    game.timeMovement = {}
    game.timeMovementStartArr = []
    game.timeMovementFinishArr = []

    // 10. Reset pause state & time
    game.paused = false
    game.lastPausedAt = 0
    game.pausedTime = 0
  }

  game.start = () => {
    let tutorialSeen = false
    try {
      tutorialSeen = localStorage.getItem('blue3d_tower_tutorial_seen') === 'true'
    } catch (e) {}

    if (!tutorialSeen) {
      const tutorial = new Instance({
        name: 'tutorial',
        action: tutorialAction,
        painter: tutorialPainter
      })
      game.addInstance(tutorial)
      const tutorialArrow = new Instance({
        name: 'tutorial-arrow',
        action: tutorialAction,
        painter: tutorialPainter
      })
      game.addInstance(tutorialArrow)
      game.setTimeMovement(constant.tutorialMovement, 500)
    }
    game.setTimeMovement(constant.bgInitMovement, 500)
    game.setVariable(constant.gameStartNow, true)
  }

  return game
}
