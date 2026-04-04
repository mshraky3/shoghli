// New Syrian flag (post-2024 independence flag):
// Three horizontal stripes: green / white / black + three red 5-pointed stars in the white stripe
export default function SyriaFlag({ size = 32, style = {} }) {
    const w = size * 1.5;
    const h = size;
    const stripe = h / 3;
    const starY = h / 2;

    const star = (cx) => {
        const r = stripe * 0.35;
        const ir = r * 0.38;
        const points = [];
        for (let i = 0; i < 5; i++) {
            const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
            const innerAngle = outerAngle + Math.PI / 5;
            points.push(`${cx + r * Math.cos(outerAngle)},${starY - r * Math.sin(outerAngle)}`);
            points.push(`${cx + ir * Math.cos(innerAngle)},${starY - ir * Math.sin(innerAngle)}`);
        }
        return <polygon key={cx} points={points.join(' ')} fill="#cc0001" />;
    };

    const starsX = [w * 0.32, w * 0.5, w * 0.68];

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
            style={{ display: 'inline-block', borderRadius: 3, ...style }}
        >
            {/* Green stripe */}
            <rect x="0" y="0" width={w} height={stripe} fill="#007a3d" />
            {/* White stripe */}
            <rect x="0" y={stripe} width={w} height={stripe} fill="#ffffff" />
            {/* Black stripe */}
            <rect x="0" y={stripe * 2} width={w} height={stripe} fill="#000000" />
            {/* Three red stars */}
            {starsX.map(star)}
        </svg>
    );
}
