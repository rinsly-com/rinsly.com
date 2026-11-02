import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'> & {
  type?: 'button' | 'submit' | 'reset'
  buttonStyle?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  children?: ReactNode
}

export function Button(props: Props): ReactNode
