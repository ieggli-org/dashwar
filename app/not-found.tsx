import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>This page could not be found.</p>
      <p>
        <Link href="/">Go to home (live feed)</Link>
      </p>
    </div>
  );
}
