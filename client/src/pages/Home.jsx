import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '../utils/Icons';

export default function Home() {
  const tools = [
    {
      id: 'image',
      title: 'Image Tools',
      description: 'Compress, resize, and convert images (JPG, PNG, WebP, AVIF).',
      icon: <Icons.Image />,
      path: '/image',
      color: 'pink',
    },
    {
      id: 'video',
      title: 'Video Tools',
      description: 'Compress, trim duration, and resize aspect ratio for videos.',
      icon: <Icons.Video />,
      path: '/video',
      color: 'blue',
    },
    {
      id: 'audio',
      title: 'Audio Tools',
      description: 'Compress, trim, format and enhance your audio files.',
      icon: <Icons.Music />,
      path: '/audio',
      color: 'purple',
    },
    {
      id: 'pdf',
      title: 'PDF Tools',
      description: 'Compress PDFs, and delete or rearrange specific pages.',
      icon: <Icons.Document />,
      path: '/pdf',
      color: 'green',
    },
    {
      id: 'merge',
      title: 'Merge Templates',
      description: 'Merge multiple images or PDFs into a single document.',
      icon: <Icons.Layers />,
      path: '/merge',
      color: 'purple',
    }
  ];

  return (
    <motion.div 
      className="home-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="home-header">
        <h2>Select a Tool</h2>
        <p>Choose the type of file you want to process to access specialized tools.</p>
      </div>

      <div className="tools-grid">
        {tools.map((tool) => (
          <Link to={tool.path} key={tool.id} className={`tool-card tool-card-${tool.color}`}>
            <div className="tool-icon-wrapper">
              {tool.icon}
            </div>
            <div className="tool-content">
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </div>
            <div className="tool-arrow">
              <Icons.ArrowRight />
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
