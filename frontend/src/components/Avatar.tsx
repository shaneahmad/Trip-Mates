import './Avatar.css';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = `avatar-${size === 'md' ? '' : size}`.replace('avatar-', '');
  const avatarSize = sizeClass ? `avatar avatar-${sizeClass}` : 'avatar';

  if (src) {
    return <img src={src} alt={name} className={`${avatarSize} ${className}`} />;
  }

  return (
    <div className={`${avatarSize} avatar-placeholder ${className}`}>
      {initials}
    </div>
  );
}
