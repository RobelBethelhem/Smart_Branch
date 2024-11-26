// 3. Document Upload
interface DocumentUploadProps {
    onNext: () => void;
    onPrev: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
  }
  
  const DocumentUpload: React.FC<DocumentUploadProps> = ({ onNext, onPrev, formData, setFormData }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setFormData({ ...formData, [e.target.name]: e.target.files[0] });
      }
    };
  
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Upload Documents</h2>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <label htmlFor="idUpload" className="block cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-700">Upload ID</span>
              <input id="idUpload" name="idUpload" type="file" className="hidden" onChange={handleFileChange} />
              <span className="mt-2 block text-sm text-gray-500">
                {formData.idUpload ? formData.idUpload.name : 'Drag and drop or click to upload'}
              </span>
            </label>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <label htmlFor="addressUpload" className="block cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-700">Upload Proof of Address</span>
              <input id="addressUpload" name="addressUpload" type="file" className="hidden" onChange={handleFileChange} />
              <span className="mt-2 block text-sm text-gray-500">
                {formData.addressUpload ? formData.addressUpload.name : 'Drag and drop or click to upload'}
              </span>
            </label>
          </div>
          <div className="flex justify-between">
            <button
              onClick={onPrev}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
            >
              Prev
            </button>
            <button
              onClick={onNext}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  export default DocumentUpload;