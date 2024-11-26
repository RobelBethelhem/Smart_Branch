import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Users, Search, Building, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Person {
  name: string;
  title: string;
  position: string;
  photo: string;
}

interface Floor {
  number: number;
  name: string;
  departments: string[];
  keyPersonnel: Person[];
}

type SearchResultItem = 
  | { type: 'department'; name: string; floor: number }
  | { type: 'person'; name: string; floor: number; title: string; position: string; photo: string };

const floors: Floor[] = [
  {
    number: 37,
    name: "Executive Suite",
    departments: ["CEO Office", "Board Room"],
    keyPersonnel: [
      { name: "Robel Asfaw", title: "CEO", position: "Executive", photo: "profile/profile.jpg" }
    ]
  },
  {
    number: 26,
    name: "Senior Management",
    departments: ["Strategy", "Finance"],
    keyPersonnel: [
      { name: "Akalework Tamene", title: "CFO", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Alamayehu Eshete", title: "COO", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Akalework Tamene", title: "CFO", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Alamayehu Eshete", title: "COO", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Akalework Tamene", title: "CFO", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Alamayehu Eshete", title: "COO", position: "Senior Management", photo: "profile/profile.jpg" },
    ]
  },
  {
    number: 14,
    name: "Marketing",
    departments: ["Marketing"],
    keyPersonnel: [
      { name: "Abel Kebede", title: "Chief Marketing Officer", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Alex Alemayehu", title: "Manager Marketing", position: "Management", photo: "profile/profile.jpg" },
      { name: "Tigist", title: "Manager Branding", position: "Management", photo: "profile/profile.jpg" },
      { name: "Abel Kebede", title: "Chief Marketing Officer", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Alex Alemayehu", title: "Manager Marketing", position: "Management", photo: "profile/profile.jpg" },
      { name: "Tigist", title: "Manager Branding", position: "Management", photo: "profile/profile.jpg" },
    ]
  },
  {
    number: 13,
    name: "IT & Digital",
    departments: ["Software Development", "Digital Channel"],
    keyPersonnel: [
      { name: "Melat Asfaw", title: "Chief Information Officer", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Bethelhem Abnew", title: "Director of Digital", position: "Management", photo: "profile/profile.jpg" },
      { name: "Fisha Tsegaye", title: "Manager of Software Dev", position: "Management", photo: "profile/profile.jpg" },
      { name: "Melat Asfaw", title: "Chief Information Officer", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Melat Asfaw", title: "Chief Information Officer", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Bethelhem Abnew", title: "Director of Digital", position: "Management", photo: "profile/profile.jpg" },
      { name: "Fisha Tsegaye", title: "Manager of Software Dev", position: "Management", photo: "profile/profile.jpg" },
      { name: "Melat Asfaw", title: "Chief Information Officer", position: "Senior Management", photo: "profile/profile.jpg" },
  
    ]
  },
  {
    number: 12,
    name: "HR and Property",
    departments: ["Human Capital and Performance", "Property and Logistics"],
    keyPersonnel: [
      { name: "Takele Debekulu", title: "Chief Human Capital", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Tomas Getachew", title: "Director of Talent Acquisition", position: "Management", photo: "profile/profile.jpg" },
      { name: "Mechal Bedada", title: "Director of Property and Logistics", position: "Management", photo: "profile/profile.jpg" },
      { name: "Takele Debekulu", title: "Chief Human Capital", position: "Senior Management", photo: "profile/profile.jpg" },
      { name: "Tomas Getachew", title: "Director of Talent Acquisition", position: "Management", photo: "profile/profile.jpg" },
      { name: "Mechal Bedada", title: "Director of Property and Logistics", position: "Management", photo: "profile/profile.jpg" },
    ]
  },
];

const FloorCard: React.FC<{ floor: Floor; isActive: boolean; onClick: () => void; onKeyPersonnelClick: () => void }> = ({ floor, isActive, onClick, onKeyPersonnelClick }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    transition={{ duration: 0.5 }}
    className={`card w-full bg-gradient-to-r from-purple-500 to-indigo-600 shadow-xl mb-4 cursor-pointer overflow-hidden ${isActive ? 'ring-4 ring-yellow-400' : ''}`}
    onClick={onClick}
  >
    <div className="card-body text-white">
      <h2 className="card-title text-2xl">Floor {floor.number} - {floor.name}</h2>
      <p>Departments: {floor.departments.join(', ')}</p>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <h3 
              className="text-xl font-semibold mb-2 cursor-pointer hover:text-yellow-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onKeyPersonnelClick();
              }}
            >
              Key Personnel (Click to view all)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-96">
              {floor.keyPersonnel.map((person, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-4 bg-white bg-opacity-20 p-3 rounded-lg"
                >
                  <img src={person.photo} alt={person.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-sm text-gray-200">{person.title}</p>
                    <p className="text-xs text-gray-300">{person.position}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

const SearchResult: React.FC<{ result: SearchResultItem; onClick: () => void }> = ({ result, onClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="flex items-center space-x-4 mb-2 bg-gradient-to-r from-blue-500 to-teal-400 p-3 rounded-lg cursor-pointer"
    onClick={onClick}
  >
    {result.type === 'person' ? (
      <img src={result.photo} alt={result.name} className="w-10 h-10 rounded-full" />
    ) : (
      <Building size={24} className="text-white" />
    )}
    <div className="text-white">
      <p className="font-semibold">{result.name}</p>
      {result.type === 'person' && (
        <>
          <p className="text-sm text-gray-200">{result.title}</p>
          <p className="text-xs text-gray-300">{result.position}</p>
        </>
      )}
      <p className="text-xs text-gray-300">Floor {result.floor}</p>
    </div>
  </motion.div>
);

const PersonModal: React.FC<{ person: Person; onClose: () => void }> = ({ person, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-bold text-red-600">{person.name}</h2>
        <button onClick={onClose} className="text-black hover:text-red-600 transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <img src={person.photo} alt={person.name} className="w-32 h-32 rounded-full border-4 border-red-600" />
        <div>
          <p className="text-xl font-semibold text-black">{person.title}</p>
          <p className="text-lg text-gray-600">{person.position}</p>
          <div className="mt-4 space-y-2">
            <p className="text-black"><strong>Department:</strong> Executive</p>
            <p className="text-black"><strong>Years of Experience:</strong> 15+</p>
            <p className="text-black"><strong>Education:</strong> MBA, Harvard Business School</p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-red-600 mb-2">About</h3>
        <p className="text-black">
          {person.name} is a visionary leader with a proven track record in driving organizational growth and innovation. 
          With extensive experience in the banking sector, {person.name.split(' ')[0]} has been instrumental in shaping Zemen Bank's 
          strategic direction and fostering a culture of excellence.
        </p>
      </div>
    </motion.div>
  </motion.div>
);

const AllPersonnelModal: React.FC<{ floor: Floor; onClose: () => void }> = ({ floor, onClose }) => {
  const [visiblePersonnel, setVisiblePersonnel] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisiblePersonnel((prev) => {
        if (prev < floor.keyPersonnel.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 300); // Adjust this value to control the speed of appearance

    return () => clearInterval(timer);
  }, [floor.keyPersonnel.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-purple-600">All Personnel - Floor {floor.number}</h2>
          <button onClick={onClose} className="text-black hover:text-purple-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {floor.keyPersonnel.slice(0, visiblePersonnel + 1).map((person, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-lg shadow-lg"
              >
                <img src={person.photo} alt={person.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white" />
                <h3 className="text-xl font-semibold text-white text-center">{person.name}</h3>
                <p className="text-lg text-gray-200 text-center">{person.title}</p>
                <p className="text-sm text-gray-300 text-center">{person.position}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BankFloorLayout: React.FC = () => {
  const [activeFloor, setActiveFloor] = useState<number | null>(null);
  const [currentFloorIndex, setCurrentFloorIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showAllPersonnel, setShowAllPersonnel] = useState<Floor | null>(null);

  useEffect(() => {
    const results: SearchResultItem[] = floors.flatMap(floor => [
      ...floor.departments.map(dept => ({ 
        type: 'department' as const, 
        name: dept, 
        floor: floor.number 
      })),
      ...floor.keyPersonnel.map(person => ({ 
        type: 'person' as const, 
        name: person.name, 
        floor: floor.number, 
        title: person.title, 
        position: person.position,
        photo: person.photo
      }))
    ]).filter(item => {
      const searchTermLower = searchTerm.toLowerCase();
      if (item.type === 'department') {
        return item.name.toLowerCase().includes(searchTermLower);
      } else {
        return (
          item.name.toLowerCase().includes(searchTermLower) ||
          item.title.toLowerCase().includes(searchTermLower) ||
          item.position.toLowerCase().includes(searchTermLower)
        );
      }
    });
    setSearchResults(results);
  }, [searchTerm]);

  const handleFloorClick = (index: number) => {
    setActiveFloor(activeFloor === index ? null : index);
  };

  const goToNextFloor = () => {
    setCurrentFloorIndex((prevIndex) => (prevIndex + 1) % floors.length);
  };

  const goToPreviousFloor = () => {
    setCurrentFloorIndex((prevIndex) => (prevIndex - 1 + floors.length) % floors.length);
  };

  const currentFloorPersonnel = floors[currentFloorIndex].keyPersonnel;

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleSearchResultClick = (result: SearchResultItem) => {
    if (result.type === 'person') {
      setSelectedPerson({
        name: result.name,
        title: result.title,
        position: result.position,
        photo: result.photo
      });
    }
  };

  const handleKeyPersonnelClick = (floor: Floor) => {
    setShowAllPersonnel(floor);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-300 text-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          Zemen Bank Headquarters Floor Guide
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="form-control">
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Search by name, position, or department..." 
                className="input input-bordered w-full bg-white text-gray-800" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-square bg-purple-600 hover:bg-purple-700 text-white">
                <Search />
              </button>
            </div>
          </div>
          {searchTerm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Search Results:</h3>
              <AnimatePresence>
                {searchResults.map((result, index) => (
                  <SearchResult 
                    key={index} 
                    result={result} 
                    onClick={() => handleSearchResultClick(result)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPreviousFloor} 
            className="btn btn-circle btn-lg mb-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none"
          >
            <ChevronUp size={32} />
          </motion.button>
          <motion.div 
            className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            Current Floor: {floors[currentFloorIndex].number}
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNextFloor} 
            className="btn btn-circle btn-lg mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none"
          >
            <ChevronDown size={32} />
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Left Wing</h2>
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-teal-400 p-4 rounded-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Users size={48} className="mx-auto mb-4 text-white" />
              <p className="text-center text-white">Department Offices</p>
            </motion.div>
          </motion.div>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Right Wing</h2>
            <motion.div 
              className="bg-gradient-to-r from-pink-500 to-red-500 p-4 rounded-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Users size={48} className="mx-auto mb-4 text-white" />
              <p className="text-center text-white">Meeting Rooms</p>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">Current Floor Personnel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFloorPersonnel.map((person, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center space-x-4 bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-lg shadow-lg cursor-pointer"
                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
                onClick={() => handlePersonClick(person)}
              >
                <img src={person.photo} alt={person.name} className="w-16 h-16 rounded-full border-2 border-yellow-400" />
                <div>
                  <p className="font-semibold text-white">{person.name}</p>
                  <p className="text-sm text-gray-300">{person.title}</p>
                  <p className="text-xs text-gray-400">{person.position}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          {floors.map((floor, index) => (
            <FloorCard
              key={floor.number}
              floor={floor}
              isActive={activeFloor === index}
              onClick={() => handleFloorClick(index)}
              onKeyPersonnelClick={() => handleKeyPersonnelClick(floor)}
            />
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedPerson && (
          <PersonModal
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAllPersonnel && (
          <AllPersonnelModal
            floor={showAllPersonnel}
            onClose={() => setShowAllPersonnel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BankFloorLayout;