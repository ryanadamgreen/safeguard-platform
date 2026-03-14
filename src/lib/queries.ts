import { supabase } from "./supabase";

// ── Homes ──

export async function getHomes() {
  const { data, error } = await supabase
    .from("homes")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

// ── Children ──

export async function getChildrenByHome(homeId: string) {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("home_id", homeId)
    .order("initials");
  if (error) throw error;
  return data;
}

// ── Devices ──

export async function getDevicesByHome(homeId: string) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("home_id", homeId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function createDevice(device: {
  name: string;
  type: string;
  home_id: string;
  child_id: string | null;
  schedule_start: string | null;
  schedule_end: string | null;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("devices")
    .insert({
      name: device.name,
      type: device.type,
      home_id: device.home_id,
      child_id: device.child_id || null,
      schedule_start: device.schedule_start || null,
      schedule_end: device.schedule_end || null,
      internet_enabled: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function toggleDeviceInternet(
  deviceId: string,
  enabled: boolean
) {
  const { error } = await supabase
    .from("devices")
    .update({ internet_enabled: enabled })
    .eq("id", deviceId);
  if (error) throw error;
}

export async function updateDeviceSchedule(
  deviceId: string,
  scheduleStart: string | null,
  scheduleEnd: string | null
) {
  const { error } = await supabase
    .from("devices")
    .update({
      schedule_start: scheduleStart,
      schedule_end: scheduleEnd,
    })
    .eq("id", deviceId);
  if (error) throw error;
}

// ── Unknown Devices ──

export async function getUnknownDevicesByHome(homeId: string) {
  const { data, error } = await supabase
    .from("unknown_devices")
    .select("*")
    .eq("home_id", homeId)
    .order("first_detected", { ascending: false });
  if (error) throw error;
  return data;
}

export async function approveUnknownDevice(
  unknownDeviceId: string,
  deviceData: {
    name: string;
    type: string;
    mac_address: string;
    child_id: string;
    home_id: string;
  }
) {
  const { error: insertError } = await supabase.from("devices").insert({
    name: deviceData.name,
    type: deviceData.type,
    mac_address: deviceData.mac_address,
    child_id: deviceData.child_id,
    home_id: deviceData.home_id,
    internet_enabled: true,
  });
  if (insertError) throw insertError;

  const { error: deleteError } = await supabase
    .from("unknown_devices")
    .delete()
    .eq("id", unknownDeviceId);
  if (deleteError) throw deleteError;
}

export async function blockUnknownDevicePermanently(
  unknownDeviceId: string
) {
  const { error } = await supabase
    .from("unknown_devices")
    .delete()
    .eq("id", unknownDeviceId);
  if (error) throw error;
}

// ── Alerts ──

export async function getAlertsByHome(homeId: string) {
  const { data, error } = await supabase
    .from("safeguarding_alerts")
    .select("*")
    .eq("home_id", homeId)
    .eq("resolved", false)
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return data;
}

// ── Reports ──

export async function getReportsByHome(homeId: string) {
  const { data, error } = await supabase
    .from("safeguarding_reports")
    .select("*")
    .eq("home_id", homeId)
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return data;
}

// ── Profiles ──

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserHomes(userId: string) {
  const { data, error } = await supabase
    .from("user_homes")
    .select("home_id, role_label, homes(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

// ── Admin: Homes ──

export async function getAllHomes() {
  const { data, error } = await supabase
    .from("homes")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createHome(home: {
  name: string;
  address: string;
  router_id: string;
  nextdns_profile_id: string;
}) {
  const { data, error } = await supabase
    .from("homes")
    .insert(home)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHome(
  homeId: string,
  updates: {
    name?: string;
    address?: string;
    router_id?: string;
    nextdns_profile_id?: string;
  }
) {
  const { error } = await supabase
    .from("homes")
    .update(updates)
    .eq("id", homeId);
  if (error) throw error;
}

// ── Admin: Managers ──

export async function getAllManagers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "home_manager")
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function getManagerAssignments() {
  const { data, error } = await supabase
    .from("user_homes")
    .select("user_id, home_id, role_label, profiles(*), homes(*)")
    .order("user_id");
  if (error) throw error;
  return data;
}

export async function assignManagerToHome(
  userId: string,
  homeId: string,
  roleLabel: string
) {
  const { error } = await supabase
    .from("user_homes")
    .insert({ user_id: userId, home_id: homeId, role_label: roleLabel });
  if (error) throw error;
}

export async function removeManagerFromHome(
  userId: string,
  homeId: string
) {
  const { error } = await supabase
    .from("user_homes")
    .delete()
    .eq("user_id", userId)
    .eq("home_id", homeId);
  if (error) throw error;
}
