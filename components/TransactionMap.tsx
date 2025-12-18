"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import Select from 'react-select';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define FilterOptions interface
interface FilterOptions {
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  locations?: string[];
}

interface LocationOption {
  value: string;
  label: string;
}

interface Transaction {
  id: number;
  amount: number;
  date: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
}

interface TransactionMapProps {
  transactions: Transaction[];
  onBack: () => void;
}

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationStats {
  minAmount: number;
  maxAmount: number;
  totalAmount: number;
  totalTransactions: number;
  dateRange: {
    start: string;
    end: string;
  };
}

const TransactionMap: React.FC<TransactionMapProps> = ({ transactions, onBack }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [key, setKey] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [stats, setStats] = useState({
    minAmount: 0,
    maxAmount: 0,
    locationFrequency: {} as Record<string, number>,
    totalTransactions: 0
  });

  const LocationPopup: React.FC<{
    location: Transaction['location'];
    transactions: Transaction[];
  }> = ({ location, transactions }) => {
    const [localFilters, setLocalFilters] = useState<FilterOptions>({});
    const [showFilters, setShowFilters] = useState(false);
    const [minAmountInput, setMinAmountInput] = useState<string>('');
    const [maxAmountInput, setMaxAmountInput] = useState<string>('');

    // Calculate location-specific statistics
    const locationStats = useMemo((): LocationStats => {
      const amounts = transactions.map(t => t.amount);
      const dates = transactions.map(t => new Date(t.date).getTime());
      
      return {
        minAmount: Math.min(...amounts),
        maxAmount: Math.max(...amounts),
        totalAmount: amounts.reduce((sum, amount) => sum + amount, 0),
        totalTransactions: transactions.length,
        dateRange: {
          start: new Date(Math.min(...dates)).toISOString().split('T')[0],
          end: new Date(Math.max(...dates)).toISOString().split('T')[0]
        }
      };
    }, [transactions]);

    // Filter transactions within the popup
    const filteredLocalTransactions = useMemo(() => {
      return transactions.filter(transaction => {
        const matchesAmount = (!localFilters.minAmount || transaction.amount >= localFilters.minAmount) &&
                            (!localFilters.maxAmount || transaction.amount <= localFilters.maxAmount);
        
        const matchesDate = (!localFilters.startDate || new Date(transaction.date) >= new Date(localFilters.startDate)) &&
                           (!localFilters.endDate || new Date(transaction.date) <= new Date(localFilters.endDate));

        return matchesAmount && matchesDate;
      });
    }, [transactions, localFilters]);

    const handleLocalFilterChange = (update: Partial<FilterOptions>) => {
      setLocalFilters(prev => ({
        ...prev,
        ...update
      }));
    };

    const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMinAmountInput(value);
      
      // Only update filter if value is valid number or empty
      if (value === '' || !isNaN(Number(value))) {
        handleLocalFilterChange({ 
          minAmount: value === '' ? undefined : Number(value)
        });
      }
    };

    const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMaxAmountInput(value);
      
      // Only update filter if value is valid number or empty
      if (value === '' || !isNaN(Number(value))) {
        handleLocalFilterChange({ 
          maxAmount: value === '' ? undefined : Number(value)
        });
      }
    };

    const handleResetFilters = () => {
      setLocalFilters({});
      setMinAmountInput('');
      setMaxAmountInput('');
    };

    return (
      <div className="p-4 max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{location.name}</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Location Statistics */}
        <div className="mb-4 bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold mb-2">Location Statistics</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600">Total Transactions:</p>
              <p className="font-medium">{locationStats.totalTransactions}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Amount:</p>
              <p className="font-medium">ETB {locationStats.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Amount Range:</p>
              <p className="font-medium">
                ETB {locationStats.minAmount.toFixed(2)} - ETB {locationStats.maxAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Date Range:</p>
              <p className="font-medium">
                {new Date(locationStats.dateRange.start).toLocaleDateString()} - 
                {new Date(locationStats.dateRange.end).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-4 border-t border-b py-4">
            <h4 className="font-semibold mb-3">Filter Transactions</h4>
            
            {/* Amount Range */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Amount Range</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={minAmountInput}
                  placeholder={`Min (${locationStats.minAmount})`}
                  className="w-1/2 p-2 border rounded text-sm"
                  onChange={handleMinAmountChange}
                  onBlur={() => {
                    // Format the value on blur
                    if (minAmountInput && !isNaN(Number(minAmountInput))) {
                      setMinAmountInput(Number(minAmountInput).toString());
                    }
                  }}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={maxAmountInput}
                  placeholder={`Max (${locationStats.maxAmount})`}
                  className="w-1/2 p-2 border rounded text-sm"
                  onChange={handleMaxAmountChange}
                  onBlur={() => {
                    // Format the value on blur
                    if (maxAmountInput && !isNaN(Number(maxAmountInput))) {
                      setMaxAmountInput(Number(maxAmountInput).toString());
                    }
                  }}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  className="w-1/2 p-2 border rounded text-sm"
                  min={locationStats.dateRange.start}
                  max={locationStats.dateRange.end}
                  onChange={(e) => handleLocalFilterChange({ 
                    startDate: e.target.value || undefined 
                  })}
                />
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  className="w-1/2 p-2 border rounded text-sm"
                  min={locationStats.dateRange.start}
                  max={locationStats.dateRange.end}
                  onChange={(e) => handleLocalFilterChange({ 
                    endDate: e.target.value || undefined 
                  })}
                />
              </div>
            </div>

            {/* Reset Filters */}
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Transactions List */}
        <div className="max-h-60 overflow-y-auto">
          <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
            <span>Showing {filteredLocalTransactions.length} of {transactions.length} transactions</span>
          </div>
          
          {filteredLocalTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border-t first:border-t-0 py-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  ETB {transaction.amount.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {filteredLocalTransactions.length === 0 && (
            <p className="text-gray-500 text-sm italic text-center py-4">
              No transactions match the current filters
            </p>
          )}
        </div>
      </div>
    );
  };

  // Get unique locations for the select options
  const locationOptions = useMemo(() => {
    const uniqueLocations = Array.from(new Set(transactions.map(t => t.location.name)));
    return uniqueLocations.map(location => ({
      value: location,
      label: location
    }));
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: Transaction) => {
      const matchesAmount = (!filters.minAmount || transaction.amount >= filters.minAmount) &&
                          (!filters.maxAmount || transaction.amount <= filters.maxAmount);
      
      const matchesDate = (!filters.startDate || new Date(transaction.date) >= new Date(filters.startDate)) &&
                         (!filters.endDate || new Date(transaction.date) <= new Date(filters.endDate));
      
      const matchesLocation = !filters.locations?.length || 
                            filters.locations.includes(transaction.location.name);

      return matchesAmount && matchesDate && matchesLocation;
    });
  }, [transactions, filters]);

  // Update statistics based on filtered transactions
  useEffect(() => {
    const amounts = filteredTransactions.map(t => t.amount);
    const locations = filteredTransactions.reduce((acc, t) => {
      acc[t.location.name] = (acc[t.location.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      minAmount: amounts.length ? Math.min(...amounts) : 0,
      maxAmount: amounts.length ? Math.max(...amounts) : 0,
      locationFrequency: locations,
      totalTransactions: filteredTransactions.length
    });
  }, [filteredTransactions]);

  // Reset map when component mounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const containers = document.getElementsByClassName('leaflet-container');
        Array.from(containers).forEach(container => {
          // @ts-ignore
          if (container._leaflet_id) {
            // @ts-ignore
            container._leaflet_id = null;
          }
        });
      }
    };
  }, []);

  const customIcon = new L.Icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
  });

  const handleFilterChange = (filterUpdate: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...filterUpdate }));
  };

  // Group transactions by location
  const transactionsByLocation = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      const locationKey = `${transaction.location.lat}-${transaction.location.lng}`;
      if (!acc[locationKey]) {
        acc[locationKey] = {
          location: transaction.location,
          transactions: []
        };
      }
      acc[locationKey].transactions.push(transaction);
      return acc;
    }, {} as Record<string, { location: Transaction['location']; transactions: Transaction[] }>);
  }, [filteredTransactions]);

  const handleLocationFilter = (locationName: string) => {
    handleFilterChange({ locations: [locationName] });
  };

  return (
    <div className="relative w-full h-screen">
      {/* Main Filters Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] w-72"
      >
        <h3 className="font-bold text-lg mb-4">Filters</h3>
        
        <div className="space-y-4">
          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-1/2 p-2 border rounded"
                onChange={(e) => handleFilterChange({ minAmount: Number(e.target.value) })}
              />
              <input
                type="number"
                placeholder="Max"
                className="w-1/2 p-2 border rounded"
                onChange={(e) => handleFilterChange({ maxAmount: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="w-1/2 p-2 border rounded"
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              />
              <input
                type="date"
                className="w-1/2 p-2 border rounded"
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Location Multi-select */}
          <div>
            <label className="block text-sm font-medium mb-1">Locations</label>
            <Select
              isMulti
              options={locationOptions}
              className="w-full"
              placeholder="Select locations..."
              onChange={(selected) => {
                const selectedLocations = selected ? selected.map(option => option.value) : [];
                handleFilterChange({ locations: selectedLocations });
              }}
              classNamePrefix="select"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 border-t pt-4">
          <h3 className="font-bold text-lg mb-2">Statistics</h3>
          <div className="space-y-2 text-sm">
            <p>Total Transactions: {stats.totalTransactions}</p>
            <p>Amount Range: ETB {stats.minAmount.toFixed(2)} - ETB {stats.maxAmount.toFixed(2)}</p>
            <div>
              <p className="font-medium mb-1">Location Frequency:</p>
              {Object.entries(stats.locationFrequency)
                .sort(([, a], [, b]) => b - a)
                .map(([location, count]) => (
                  <p key={location} className="pl-2">
                    {location}: {count} transactions
                  </p>
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      <MapContainer
        key={key}
        center={[9.005401, 38.763611]}
        zoom={6}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.values(transactionsByLocation).map(({ location, transactions }) => (
          <Marker
            key={`${location.lat}-${location.lng}`}
            position={[location.lat, location.lng]}
            icon={customIcon}
          >
            <Popup className="location-popup">
              <LocationPopup location={location} transactions={transactions} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={onBack}
        className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg 
                   shadow-lg z-[1000] hover:bg-white transition-colors duration-300"
      >
        Back
      </motion.button>

      {selectedTransaction && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000]"
        >
          <h3 className="font-bold text-lg mb-2">Transaction Details</h3>
          <p className="mb-1">
            <span className="font-semibold">Location:</span> {selectedTransaction.location.name}
          </p>
          <p className="mb-1">
            <span className="font-semibold">Amount:</span> ETB {selectedTransaction.amount.toFixed(2)}
          </p>
          <p>
            <span className="font-semibold">Date:</span> {selectedTransaction.date}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TransactionMap;