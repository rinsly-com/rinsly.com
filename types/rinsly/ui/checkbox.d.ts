import type { ReactElement, ReactNode } from 'react'

type Props = {
  children?: ReactNode
  className?: string
  id?: string
  checked?: boolean
  nativeButton?: boolean
  keepMounted?: boolean
  render?: ReactElement
  onCheckedChange?: (value: boolean) => void
  'aria-describedby'?: string
}

export function Checkbox(props: Props): ReactNode
export namespace Checkbox {
  function Root(props: Props): ReactNode
  function Indicator(props: Props): ReactNode
}
