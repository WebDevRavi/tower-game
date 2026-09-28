import { getHookStatus, drawYellowString } from './utils'
import * as constant from './constant'

export const tutorialAction = (instance, engine, time) => {
  const { width, height } = engine
  const { name } = instance
  if (!instance.ready) {
    instance.ready = true
    const tutorialWidth = width * 0.2
    instance.updateWidth(tutorialWidth)
    instance.height = tutorialWidth * 0.46
    instance.x = engine.calWidth - instance.calWidth
    instance.y = height * 0.45
    if (name !== 'tutorial') {
      instance.y += instance.height * 1.2
    }
  }
  if (name !== 'tutorial') {
    instance.y += Math.cos(time / 200) * instance.height * 0.01
  }
}

export const tutorialPainter = (instance, engine) => {
  if (engine.checkTimeMovement(constant.tutorialMovement)) {
    return
  }
  if (getHookStatus(engine) !== constant.hookNormal) {
    return
  }
  const { ctx } = engine
  const { name } = instance
  const t = engine.getImg(name)
  ctx.drawImage(t, instance.x, instance.y, instance.width, instance.height)
  if (name === 'tutorial') {
    drawYellowString(engine, {
      string: 'CLICK / TAP TO DROP',
      size: engine.width * 0.042,
      x: engine.calWidth,
      y: instance.y + instance.height + (engine.width * 0.16),
      textAlign: 'center',
      fontWeight: 'bold',
      glowColor: 'rgba(0,0,0,0.5)',
      glowBlur: 4
    })
  }
}

