import { Link } from 'react-router-dom';
import { policies } from '../data/policies';

export default function PolicyLinks() {
  return (
    <nav aria-label="Policies and business information" className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-3 px-4 py-6 text-sm">
      {policies.map((policy) => (
        <Link key={policy.path} to={policy.path} className="underline underline-offset-4 hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
          {policy.title}
        </Link>
      ))}
    </nav>
  );
}
