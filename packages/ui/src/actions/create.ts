import { createLocationsAccessor } from 'tokyo-api';

export default async function (locations: ReturnType<typeof createLocationsAccessor>) {
  locations.mutate({
    name: 'Korea October 23',
    path: '/Users/tihav/Nextcloud/Footage/Korea October 23',
  });
}
