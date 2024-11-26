import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Product {
  name: string;
  description: string;
  videoUrl: string;
  imageUrl?: string; // Optional image URL
}

const products: Product[] = [
  {
    name: 'ATM Usage',
    description: 'Access your money 24/7 with our widespread ATM network.',
    videoUrl: 'video/sample.mp4',
    imageUrl: 'profile/profile.jpg',
  },
  {
    name: 'Internet Banking',
    description: 'Manage your accounts, transfer funds, and pay bills online.',
    videoUrl: 'video/sample.mp4',
    imageUrl: 'profile/akalework.jpg',
  },
  {
    name: 'Mobile Banking',
    description: 'Bank on-the-go with our user-friendly mobile app.',
    videoUrl: 'video/sample.mp4',
    imageUrl: 'profile/profile.jpg',
  },
  {
    name: 'Loans',
    description: 'Get the financial support you need with our flexible loan options.',
    videoUrl: 'video/sample.mp4',
    imageUrl: 'profile/akalework.jpg',
  },
];

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isSelected, onClick }) => (
  <motion.div
    className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer ${isSelected ? 'border-4 border-blue-500' : ''}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 100, damping: 10 }}
  >
    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
    {product.imageUrl && (
      <img src={product.imageUrl} alt={product.name} className="mb-2 w-full h-32 object-cover rounded" />
    )}
    <p className="text-gray-600">{product.description}</p>
  </motion.div>
);

interface BankProductsShowcaseProps {
  onBack: () => void;
}

const BankProductsShowcase: React.FC<BankProductsShowcaseProps> = ({ onBack }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Our Bank Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <ProductCard
              key={product.name}
              product={product}
              isSelected={selectedProduct === product}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
        </div>
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold mb-4">{selectedProduct.name}</h3>
              <video className="w-full rounded-lg mb-4" controls autoPlay muted loop>
                <source src={selectedProduct.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold mb-4">Details</h3>
              <ol className="list-decimal list-inside">
                <li className="mb-2">Feature 1: {selectedProduct.description}</li>
                {/* You can add more steps here if needed */}
                <li className="mb-2">Feature 2: Access your funds easily.</li>
                <li className="mb-2">Feature 3: Secure transactions guaranteed.</li>
                <li className="mb-2">Feature 4: 24/7 customer support available.</li>
              </ol>
            </motion.div>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="mt-8 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors duration-300"
        >
          Back
        </motion.button>
      </motion.div>
    </div>
  );
};

export default BankProductsShowcase;