import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';
import { LibraryList } from './components/LibraryList';

export default function LibrariesPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getBreadcrumbItems('/libraries')} />
        <h1 className="text-2xl font-bold tracking-tight">Libraries</h1>
        <p className="text-muted-foreground mt-1">
          Manage web component libraries registered with the admin dashboard.
        </p>
      </div>

      <LibraryList />
    </div>
  );
}
