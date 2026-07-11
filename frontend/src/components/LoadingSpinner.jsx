export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col justify-center items-center h-40 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}