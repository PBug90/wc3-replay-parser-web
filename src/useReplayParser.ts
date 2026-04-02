import { useState, useCallback } from 'react'
import { Buffer } from 'buffer'
import W3GReplay from 'w3gjs'
import type { ParserOutput } from 'w3gjs/dist/types/types'
import type { GameDataBlock } from 'w3gjs/dist/types/parsers/GameDataParser'
import type { PositionedAction } from './Heatmap'

export interface ReplayParserState {
  replay: ParserOutput | null
  actions: PositionedAction[]
  loading: boolean
  error: string | null
  fileName: string | null
  parseFile: (file: File) => void
  parseUrl: (url: string) => void
  parseBuffer: (buffer: ArrayBuffer, name: string) => void
  reset: () => void
}

export function useReplayParser(): ReplayParserState {
  const [replay, setReplay] = useState<ParserOutput | null>(null)
  const [actions, setActions] = useState<PositionedAction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const parseBuffer = useCallback(async (arrayBuffer: ArrayBuffer, name: string) => {
    setLoading(true)
    setError(null)
    setReplay(null)
    setActions([])
    setFileName(name)
    try {
      const buffer = Buffer.from(arrayBuffer)
      const parser = new W3GReplay()

      const collectedActions: PositionedAction[] = []
      let msElapsed = 0

      parser.on('gamedatablock', (block: GameDataBlock) => {
        if (!('commandBlocks' in block)) return
        msElapsed += block.timeIncrement
        for (const cmdBlock of block.commandBlocks) {
          for (const action of cmdBlock.actions) {
            if (action.id === 0x11 || action.id === 0x12 || action.id === 0x13) {
              collectedActions.push({
                time: msElapsed,
                playerId: cmdBlock.playerId,
                x: action.target[0],
                y: action.target[1],
              })
            } else if (action.id === 0x14 || action.id === 0x15) {
              collectedActions.push({
                time: msElapsed,
                playerId: cmdBlock.playerId,
                x: action.targetA[0],
                y: action.targetA[1],
              })
            }
          }
        }
      })

      const result = await parser.parse(buffer as unknown as string)
      setReplay(result)
      setActions(collectedActions)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to parse replay file.')
    } finally {
      setLoading(false)
    }
  }, [])

  const parseFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.w3g')) {
        setError('Please select a valid Warcraft III replay file (.w3g)')
        return
      }
      parseBuffer(await file.arrayBuffer(), file.name)
    },
    [parseBuffer],
  )

  const parseUrl = useCallback(
    async (url: string) => {
      const name = url.split('/').pop() ?? url
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        parseBuffer(await res.arrayBuffer(), name)
      } catch (e) {
        setError(e instanceof Error ? e.message : `Failed to fetch ${url.split('/').pop()}`)
      }
    },
    [parseBuffer],
  )

  const reset = useCallback(() => {
    setReplay(null)
    setActions([])
    setError(null)
    setFileName(null)
  }, [])

  return { replay, actions, loading, error, fileName, parseFile, parseUrl, parseBuffer, reset }
}
