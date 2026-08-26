/**
 * Google Material Symbols Rounded wrapper.
 * Usage: <Icon name="hotel" size={24} filled />
 */
export default function Icon({ name, size = 24, filled = false, className = "", style = {} }) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        lineHeight: 1,
        verticalAlign: "middle",
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
