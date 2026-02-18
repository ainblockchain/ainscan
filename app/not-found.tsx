import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h2>
      <p className="text-gray-500 mb-4">
        The resource you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
