export default function Button({ children, variant = 'secondary', ...props }) {
  const variantClass =
    variant === 'default' || variant === 'secondary' ? 'btn-secondary' :
    variant === 'primary' ? 'btn-primary' :
    variant === 'success' ? 'btn-secondary' :  // keep outline style
    variant === 'warning' ? 'btn-ghost' :
    variant === 'danger' ? 'btn-danger' :
    `btn-${variant}`;

  return (
    <button className={`btn ${variantClass}`} {...props}>
      {children}
    </button>
  );
}
