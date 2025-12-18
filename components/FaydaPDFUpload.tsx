import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FaydaPDFUploadProps {
  onDataExtracted: (data: any) => void;
  onClose: () => void;
}

const FaydaPDFUpload: React.FC<FaydaPDFUploadProps> = ({ onDataExtracted, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadPDFJS = async () => {
    // @ts-ignore
    if (window.pdfjsLib) {
      // @ts-ignore
      return window.pdfjsLib;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        // @ts-ignore
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        // @ts-ignore
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPDFJS();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // @ts-ignore
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          console.log('PDF loaded, pages:', pdf.numPages);

          let fullText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
              // @ts-ignore
              .map(item => item.str)
              .join(' ');

            fullText += pageText + '\n';
            console.log(`Page ${pageNum} text length:`, pageText.length);
          }

          console.log('Total extracted text length:', fullText.length);
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseTextForFields = (text: string) => {
    const data = {
      firstName: null as string | null,
      middleName: null as string | null,
      surname: null as string | null,
      dateOfBirth: null as string | null,
      region: null as string | null,
      city: null as string | null,
      sex: null as string | null,
      zone: null as string | null,
      nationality: null as string | null,
      woreda: null as string | null,
      phoneNumber: null as string | null,
      idNumber: null as string | null,
      fullName: null as string | null,
      address: null as string | null,
    };

    console.log('Parsing text, length:', text.length);
    console.log('First 1000 chars:', text.substring(0, 1000));

    const cleanText = text.replace(/\s+/g, ' ').trim();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log('Lines found:', lines.length);
    console.log('First 30 lines:', lines.slice(0, 30));

    // Extract FCN (ID Number)
    const fcnMatch = text.match(/FCN:\s*(\d+)/);
    if (fcnMatch) {
      data.idNumber = fcnMatch[1];
      console.log('Found FCN:', data.idNumber);
    }

    // Extract full name (appears as "FirstName MiddleName Surname" after Amharic name)
    // Look for pattern: Amharic name followed by English name on next line or after newline
    const fullNameMatch = text.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/);
    if (fullNameMatch) {
      data.firstName = fullNameMatch[1];
      data.middleName = fullNameMatch[2];
      data.surname = fullNameMatch[3];
      data.fullName = `${fullNameMatch[1]} ${fullNameMatch[2]} ${fullNameMatch[3]}`;
      console.log('Found name:', data.fullName);
    }

    // Extract date of birth (format: DD/MM/YYYY | YYYY/MM/DD)
    const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*(\d{4}\/\d{2}\/\d{2})/);
    if (dobMatch) {
      data.dateOfBirth = dobMatch[1]; // Use the first format (DD/MM/YYYY)
      console.log('Found DOB:', data.dateOfBirth);
    }

    // Extract sex (format: ወንድ | Male or ሴት | Female)
    const sexMatch = text.match(/(?:ወንድ|ሴት)\s*\|\s*(Male|Female)/i);
    if (sexMatch) {
      data.sex = sexMatch[1];
      console.log('Found sex:', data.sex);
    }

    // Extract nationality
    if (text.includes('Ethiopian') || text.includes('ኢትዮጵያዊ')) {
      data.nationality = 'Ethiopian';
      console.log('Found nationality:', data.nationality);
    }

    // Extract Region (look for Amharic followed by English)
    const regionMatch = text.match(/([ሀ-፼\s]+)\s+(Addis Ababa|Oromia|Amhara|Tigray|Afar|Somali|SNNP|Benishangul|Gambela|Harari|Dire Dawa)/i);
    if (regionMatch) {
      data.region = regionMatch[2];
      console.log('Found region:', data.region);
    }

    // Extract Zone/Sub City (look for pattern like "አዲስ ከተማ Addis Ketema")
    const zoneMatch = text.match(/([ሀ-፼\s]+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?=Woreda|ወረዳ|Phone|ስልክ|$)/);
    if (zoneMatch && zoneMatch[2] && zoneMatch[2] !== data.region) {
      data.zone = zoneMatch[2];
      data.city = zoneMatch[2]; // In Fayda, Zone/City Admin/Sub City is the city
      console.log('Found zone/city:', data.zone);
    }

    // Extract Woreda (format: "ወረዳ 06 Woreda 06")
    const woredaMatch = text.match(/Woreda\s+(\d{2})/i);
    if (woredaMatch) {
      data.woreda = `Woreda ${woredaMatch[1]}`;
      console.log('Found woreda:', data.woreda);
    }

    // Extract phone number (10 digits starting with 09 or 07)
    const phoneMatch = text.match(/(0[97]\d{8})/);
    if (phoneMatch) {
      data.phoneNumber = phoneMatch[1];
      console.log('Found phone:', data.phoneNumber);
    }


    // Clean up
    for (const key in data) {
      if (data[key as keyof typeof data] && typeof data[key as keyof typeof data] === 'string') {
        let value = data[key as keyof typeof data] as string;
        value = value.replace(/^[:\s]+|[:\s]+$/g, '').replace(/\s+/g, ' ').trim();
        if (value.length > 100 || value.length < 1) {
          data[key as keyof typeof data] = null;
        } else {
          data[key as keyof typeof data] = value as any;
        }
      }
    }

    return data;
  };

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      console.log('Processing PDF:', file.name);
      const text = await extractTextFromPDF(file);
      console.log('Extracted text length:', text.length);
      console.log('First 500 chars:', text.substring(0, 500));

      if (text.length < 50) {
        throw new Error('Could not extract text from PDF. The PDF may be image-based.');
      }

      const data = parseTextForFields(text);
      console.log('Parsed data:', data);

      onDataExtracted({
        success: true,
        data: data,
        url: file.name,
        timestamp: new Date().toISOString(),
        extractionMethod: 'pdf-upload',
        rawText: text.substring(0, 1000),
      });

    } catch (err) {
      console.error('PDF processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FileText className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Upload Fayda PDF</h2>
              <p className="text-sm text-gray-600">Upload your downloaded Fayda ID PDF file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin mx-auto w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"></div>
              <p className="text-lg font-semibold text-gray-700">Processing PDF...</p>
              <p className="text-sm text-gray-500">Extracting data from your ID card</p>
            </div>
          ) : selectedFile ? (
            <div className="space-y-4">
              <CheckCircle className="mx-auto text-green-500" size={48} />
              <p className="text-lg font-semibold text-gray-700">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">PDF ready to process</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto text-gray-400" size={48} />
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Drop your Fayda PDF here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <span className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all cursor-pointer inline-block">
                    Choose PDF File
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
          >
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>How to get your Fayda PDF:</strong>
          </p>
          <ol className="text-sm text-blue-700 mt-2 ml-4 list-decimal space-y-1">
            <li>Go to <a href="https://bankpc.fayda.et/download-pdf" target="_blank" rel="noopener noreferrer" className="underline">bankpc.fayda.et/download-pdf</a></li>
            <li>Your ID card PDF will be downloaded automatically</li>
            <li>Upload that PDF file here</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
};

export default FaydaPDFUpload;
