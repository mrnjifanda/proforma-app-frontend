export default function imageLoader({ src, width, quality = 75 }) {

    if (src.startsWith('http://') || src.startsWith('https://')) {
        return src;
    }

    if (src.startsWith('/')) {
        return src;
    }

    return `/${src}`;
}
