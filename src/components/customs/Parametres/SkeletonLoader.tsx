interface SkeletonLoaderProps {
    height?: string;
    width?: string;
    className?: string;
}

export default function SkeletonLoader({
    height = 'h-4',
    width = 'w-full',
    className = ''
}: SkeletonLoaderProps) {
    return (
        <div
            className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-lg ${height} ${width} ${className}`}
        />
    );
}
