import { generateDynamicLogo } from '../../utils/logoMapper';

const ServiceLogo = ({ serviceName, size = 32, style = {}, className = '' }) => {
  return (
    <img
      src={generateDynamicLogo(serviceName)}
      alt={serviceName}
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: size > 30 ? 8 : 6,
        objectFit: 'cover',
        ...style
      }}
    />
  );
};

export default ServiceLogo;
