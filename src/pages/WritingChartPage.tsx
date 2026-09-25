import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ARABIC_LETTERS,
  FIRST_CHARACTERS,
  HIRAGANA_GRID,
  HIRAGANA_VOICED,
  HIRAGANA_YOON,
  KATAKANA_GRID,
  KATAKANA_VOICED,
  KATAKANA_YOON,
  KO_BLOCKS,
  KO_CONSONANT_ROW,
  KO_VOWEL_ROW,
  PINYIN_FINALS,
  PINYIN_TABLE,
  hasWritingChart,
  type ChartCell,
  type ChartGrid,
} from '../data/writingCharts'
import { languageById } from '../data/languages'
import { speakText, ttsLangFor } from '../learning/tts'
import { useAppState } from '../state/AppState'

const cellClass =
  'grid min-h-16 min-w-14 cursor-pointer place-items-center rounded-xl border-[2.5px] border-ink bg-paper px-1 py-1.5 leading-none shadow-chunky-sm'

function CellButton({
  cell,
  lang,
}: {
  cell: ChartCell
  lang: string
}) {
  return (
    <button
      type="button"
      className={cellClass}
      onClick={() => speakText(cell.glyph, lang)}
    >
      <span className="font-display text-2xl font-bold">{cell.glyph}</span>
      <span className="text-[0.7rem] font-extrabold text-ink-soft">{cell.reading}</span>
    </button>
  )
}

function Grid({ grid, lang }: { grid: ChartGrid; lang: string }) {
  return (
    <div className="grid gap-1.5 overflow-x-auto">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap gap-1.5">
          {row.map((cell, cellIndex) =>
            cell ? (
              <CellButton key={`${cell.glyph}-${cellIndex}`} cell={cell} lang={lang} />
            ) : (
              <span key={`empty-${cellIndex}`} className="min-w-14" />
            ),
          )}
        </div>
      ))}
    </div>
  )
}

export function WritingChartPage() {
  const navigate = useNavigate()
  const { profile } = useAppState()
  const lang = languageById(profile.languageId)
  const tts = ttsLangFor(profile.languageId)
  const [sheet, setSheet] = useState<'basic' | 'kata' | 'voiced'>('basic')

  return (
    <div className="atmosphere-grid flex min-h-full flex-1 flex-col">
      <header className="flex items-center gap-2 px-3.5 pt-3">
        <button
          type="button"
          className="min-h-11 rounded-full border-[2.5px] border-ink bg-paper px-3 font-extrabold"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <h1 className="text-lg">{lang.writingSystem}</h1>
      </header>
      <div className="page-pad grid gap-3">
        {!hasWritingChart(profile.languageId) && (
          <p className="font-bold">
            {lang.name} uses the Latin alphabet. There is no writing chart.
          </p>
        )}

        {profile.languageId === 'ja' && (
          <>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['basic', 'Hiragana'],
                  ['kata', 'Katakana'],
                  ['voiced', 'Voiced & small-ya'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`min-h-11 rounded-full border-[2.5px] border-ink px-3 font-extrabold ${
                    sheet === id ? 'bg-cyan' : 'bg-paper'
                  }`}
                  onClick={() => setSheet(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {sheet === 'basic' && <Grid grid={HIRAGANA_GRID} lang={tts} />}
            {sheet === 'kata' && <Grid grid={KATAKANA_GRID} lang={tts} />}
            {sheet === 'voiced' && (
              <div className="grid gap-4">
                <p className="font-extrabold">Hiragana</p>
                <Grid grid={HIRAGANA_VOICED} lang={tts} />
                <div className="flex flex-wrap gap-1.5">
                  {HIRAGANA_YOON.map((cell) => (
                    <CellButton key={cell.glyph} cell={cell} lang={tts} />
                  ))}
                </div>
                <p className="font-extrabold">Katakana</p>
                <Grid grid={KATAKANA_VOICED} lang={tts} />
                <div className="flex flex-wrap gap-1.5">
                  {KATAKANA_YOON.map((cell) => (
                    <CellButton key={cell.glyph} cell={cell} lang={tts} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {profile.languageId === 'zh' && (
          <>
            <p className="font-bold">
              Pinyin sounds. This is not a list of every character.
            </p>
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th />
                    {PINYIN_FINALS.map((final) => (
                      <th key={final} className="px-1 text-xs font-extrabold">
                        {final}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PINYIN_TABLE.map((row) => (
                    <tr key={row.initial}>
                      <th className="pr-2 text-left text-sm font-extrabold">
                        {row.initial}
                      </th>
                      {row.cells.map((cell, index) => (
                        <td key={index}>
                          {cell ? (
                            <button
                              type="button"
                              className="min-h-9 cursor-pointer rounded-lg border-2 border-ink bg-paper px-1.5 text-sm font-extrabold"
                              onClick={() => speakText(cell.glyph, tts)}
                            >
                              {cell.glyph}
                            </button>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-extrabold">First characters</p>
            <div className="flex flex-wrap gap-1.5">
              {FIRST_CHARACTERS.map((cell) => (
                <CellButton key={cell.glyph} cell={cell} lang={tts} />
              ))}
            </div>
          </>
        )}

        {profile.languageId === 'ko' && (
          <>
            <p className="font-extrabold">Consonants</p>
            <div className="flex flex-wrap gap-1.5">
              {KO_CONSONANT_ROW.map((cell) => (
                <CellButton key={cell.glyph} cell={cell} lang={tts} />
              ))}
            </div>
            <p className="font-extrabold">Vowels</p>
            <div className="flex flex-wrap gap-1.5">
              {KO_VOWEL_ROW.map((cell) => (
                <CellButton key={cell.glyph} cell={cell} lang={tts} />
              ))}
            </div>
            <p className="font-extrabold">Syllable blocks</p>
            <Grid grid={KO_BLOCKS} lang={tts} />
          </>
        )}

        {profile.languageId === 'ar' && (
          <div className="grid gap-2" dir="rtl" lang="ar">
            {ARABIC_LETTERS.map((letter) => (
              <div
                key={letter.name}
                className="grid gap-1 rounded-2xl border-[2.5px] border-ink bg-paper p-2"
              >
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['isolated', letter.isolated],
                      ['initial', letter.initial],
                      ['medial', letter.medial],
                      ['final', letter.final],
                    ] as const
                  ).map(([shape, glyph]) => (
                    <button
                      key={shape}
                      type="button"
                      className={cellClass}
                      onClick={() => speakText(letter.isolated, tts)}
                    >
                      <span className="font-display text-2xl font-bold">{glyph}</span>
                      <span className="text-[0.65rem] font-extrabold text-ink-soft">
                        {shape}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-sm font-extrabold" dir="ltr">
                  {letter.name} · {letter.sound}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
