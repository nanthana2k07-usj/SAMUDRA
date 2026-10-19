interface PageHeadingProps {
  eyebrow: string
  title: string
  description: string
}

export function PageHeading({ eyebrow, title, description }: PageHeadingProps) {
  return (
    <div className="gov-page-heading">
      <span className="gov-page-heading__eyebrow">{eyebrow}</span>
      <h1 className="gov-page-heading__title">{title}</h1>
      <p className="gov-page-heading__desc">{description}</p>
    </div>
  )
}
