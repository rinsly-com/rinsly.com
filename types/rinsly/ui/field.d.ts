import type { ReactElement, ReactNode } from 'react'

type PartProps = {
  children?: ReactNode
  className?: string
  id?: string
  render?: ReactElement
}

export function Field(props: PartProps): ReactNode
export namespace Field {
  function Root(props: PartProps): ReactNode
  function Label(props: PartProps): ReactNode
  function Control(props: PartProps): ReactNode
  function Description(props: PartProps): ReactNode
}
