import { GifItem } from "./GifItems";
import { useFetchGifs } from "../hooks/useFetchGifs";

export const GifGrid = ({ category }) => {
    const { images, isLoading } = useFetchGifs(category);
    return (
        <section className="gif-section">
            <div className="gif-section__header">
                <h3 className="gif-section__title">{category}</h3>
                {isLoading && <span className="gif-section__loading">Cargando...</span>}
            </div>
            <div className="card-grid">
                {images.map((img) => (
                    <GifItem key={img.id} {...img} />
                ))}
            </div>
        </section>
    )
}
