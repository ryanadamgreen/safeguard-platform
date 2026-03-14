-- MAC address is not required for DoH-based devices.
-- DoH devices are identified by their UUID (embedded in the profile URL),
-- not by MAC address. Make the column nullable so devices can be created
-- without a MAC address.

alter table devices
  alter column mac_address drop not null;
