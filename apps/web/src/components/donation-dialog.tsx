import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { env } from '@/env'
import { CheckIcon, CopyIcon, ExternalLinkIcon, HeartIcon, QrCodeIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

function formatEmvField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${id}${length}${value}`
}

function computeCrc16Ccitt(payload: string): string {
  let crc = 0xffff
  for (let index = 0; index < payload.length; index++) {
    crc ^= payload.charCodeAt(index) << 8
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildPixBrCode(
  pixKey: string,
  merchantName = 'DANIEL S GONCALVES',
  merchantCity = 'SAO PAULO',
): string {
  const gui = formatEmvField('00', 'br.gov.bcb.pix')
  const keyField = formatEmvField('01', pixKey.trim())
  const descriptionField = formatEmvField('02', 'CronFlow MIT')
  const merchantAccountInfo = formatEmvField('26', `${gui}${keyField}${descriptionField}`)
  const additionalDataField = formatEmvField('62', formatEmvField('05', 'CRONFLOW'))

  const payloadWithoutCrc = [
    formatEmvField('00', '01'),
    merchantAccountInfo,
    formatEmvField('52', '0000'),
    formatEmvField('53', '986'),
    formatEmvField('58', 'BR'),
    formatEmvField('59', merchantName.slice(0, 25)),
    formatEmvField('60', merchantCity.slice(0, 15)),
    additionalDataField,
    '6304',
  ].join('')

  const crc = computeCrc16Ccitt(payloadWithoutCrc)
  return `${payloadWithoutCrc}${crc}`
}

function generateDeterministicMatrix(seedText: string, size = 21): boolean[][] {
  let hash = 2166136261
  for (let index = 0; index < seedText.length; index++) {
    hash ^= seedText.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  function drawFinderPattern(startRow: number, startCol: number) {
    for (let rowOffset = 0; rowOffset < 7; rowOffset++) {
      for (let colOffset = 0; colOffset < 7; colOffset++) {
        const isBorder = rowOffset === 0 || rowOffset === 6 || colOffset === 0 || colOffset === 6
        const isInner = rowOffset >= 2 && rowOffset <= 4 && colOffset >= 2 && colOffset <= 4
        const targetRow = matrix[startRow + rowOffset]
        if (targetRow) {
          targetRow[startCol + colOffset] = isBorder || isInner
        }
      }
    }
  }

  drawFinderPattern(0, 0)
  drawFinderPattern(0, size - 7)
  drawFinderPattern(size - 7, 0)

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const inTopLeft = row < 8 && col < 8
      const inTopRight = row < 8 && col >= size - 8
      const inBottomLeft = row >= size - 8 && col < 8
      if (inTopLeft || inTopRight || inBottomLeft) continue

      hash ^= (row * 31 + col * 17) & 0xff
      hash = Math.imul(hash, 16777619)
      const targetRow = matrix[row]
      if (targetRow) {
        targetRow[col] = (Math.abs(hash) & 1) === 1
      }
    }
  }

  return matrix
}

export interface DonationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonationDialog({ open, onOpenChange }: DonationDialogProps) {
  const [copiedTarget, setCopiedTarget] = useState<'key' | 'brcode' | null>(null)

  const pixKey = env.VITE_DONATION_PIX_KEY
  const sponsorUrl = env.VITE_DONATION_SPONSOR_URL

  const pixBrCode = useMemo(() => buildPixBrCode(pixKey), [pixKey])
  const qrMatrix = useMemo(() => generateDeterministicMatrix(pixBrCode, 21), [pixBrCode])

  async function handleCopy(value: string, target: 'key' | 'brcode', label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedTarget(target)
      toast.success(`${label} copiado para a área de transferência.`)
      window.setTimeout(() => {
        setCopiedTarget((current) => (current === target ? null : current))
      }, 2000)
    } catch {
      toast.error('Não foi possível copiar automaticamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-status-danger-bg px-2.5 py-0.5 text-xs font-semibold text-status-danger-text">
            <HeartIcon aria-hidden="true" className="size-3.5 fill-current" />
            <span>Open Source • Licença MIT</span>
          </div>
          <DialogTitle>Apoie o desenvolvimento do CronFlow</DialogTitle>
          <DialogDescription>
            O CronFlow é distribuído sob licença MIT, sem telemetria oculta ou limites artificiais.
            Se a ferramenta economiza tempo da sua equipe, considere apoiar a manutenção do projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* PIX Section */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
            <div className="mx-auto flex shrink-0 flex-col items-center gap-1.5 rounded-lg border border-border bg-white p-2.5 shadow-2xs sm:mx-0">
              <svg
                viewBox="0 0 21 21"
                role="img"
                aria-label="Representação visual do código PIX"
                className="size-28 text-slate-950"
              >
                {qrMatrix.map((rowValues, rowIndex) =>
                  rowValues.map((isFilled, colIndex) =>
                    isFilled ? (
                      <rect
                        key={`${rowIndex}-${colIndex}`}
                        x={colIndex}
                        y={rowIndex}
                        width={1}
                        height={1}
                        fill="currentColor"
                      />
                    ) : null,
                  ),
                )}
              </svg>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-slate-600">
                <QrCodeIcon aria-hidden="true" className="size-3" />
                <span>PIX BRCode</span>
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-foreground">
                  Chave PIX direta (E-mail / Aleatória)
                </span>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                  <code className="truncate font-mono text-xs font-semibold text-primary">
                    {pixKey}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(pixKey, 'key', 'Chave PIX')}
                  >
                    {copiedTarget === 'key' ? (
                      <>
                        <CheckIcon aria-hidden="true" />
                        <span>Copiada</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon aria-hidden="true" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-foreground">
                  PIX Copia e Cola (EMV-Co BRCode)
                </span>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                  <code className="truncate font-mono text-[11px] text-muted-foreground">
                    {pixBrCode}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(pixBrCode, 'brcode', 'Código PIX Copia e Cola')}
                  >
                    {copiedTarget === 'brcode' ? (
                      <>
                        <CheckIcon aria-hidden="true" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon aria-hidden="true" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* GitHub Sponsors / External Link */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-foreground">
                GitHub Sponsors / Apoio Internacional
              </span>
              <span className="text-xs text-muted-foreground">
                Contribua mensalmente ou com valor único pelo GitHub Sponsors.
              </span>
            </div>

            <a
              href={sponsorUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-muted"
            >
              <HeartIcon aria-hidden="true" className="size-3.5 text-destructive" />
              <span>Abrir GitHub Sponsors</span>
              <ExternalLinkIcon aria-hidden="true" className="size-3" />
            </a>
          </div>
        </div>

        <DialogFooter>
          <DialogClose className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-muted">
            Fechar
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
