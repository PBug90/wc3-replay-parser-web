import { useEffect } from 'react'

const COLORS = ['#c8a050', '#e8c870', '#7dd3fc', '#c5b99a', '#fff8e0', '#f0d080']
const SHAPES = ['✦', '·', '✧', '⬡', '◆', '★']

export default function MagicPoof() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const count = 10 + Math.floor(Math.random() * 6)
      for (let i = 0; i < count; i++) {
        spawnParticle(e.clientX, e.clientY)
      }
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return null
}

function spawnParticle(x: number, y: number) {
  const el = document.createElement('span')
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const angle = Math.random() * 360
  const dist = 30 + Math.random() * 60
  const size = 8 + Math.random() * 10
  const duration = 500 + Math.random() * 400

  const dx = Math.cos((angle * Math.PI) / 180) * dist
  const dy = Math.sin((angle * Math.PI) / 180) * dist

  el.textContent = shape
  el.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    color: ${color};
    font-size: ${size}px;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    animation: magic-poof ${duration}ms ease-out forwards;
    --dx: ${dx}px;
    --dy: ${dy}px;
  `

  document.body.appendChild(el)
  setTimeout(() => el.remove(), duration)
}
