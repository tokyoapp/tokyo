import { locationsAccessor } from '../accessors/locations.ts';

export default async function (locations: ReturnType<typeof locationsAccessor>) {
  locations.create({
    name: 'Korea October 23',
    path: '/Users/tihav/Nextcloud/Footage/Korea October 23',
  });
}
