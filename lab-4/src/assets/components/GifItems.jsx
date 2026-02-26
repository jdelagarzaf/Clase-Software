export const GifItem = ({ title, url }) => {
    return (
        <article className="gif-card">
            <div className="gif-card__image-wrapper">
                <img src={url} alt={title} loading="lazy" decoding="async" />
            </div>
            <p className="gif-card__title" title={title}>{title}</p>
        </article>
    )
}
