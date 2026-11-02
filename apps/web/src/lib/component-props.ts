export type WithStringClassName<Props> = Omit<Props, 'className'> & {
  className?: string
}
