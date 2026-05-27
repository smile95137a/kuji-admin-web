import { api } from './FrontAPI';

const basePath = '/district';

export interface DistrictInfo {
  id?: string;
  city: string;
  districtName: string;
  zipCode?: string;
}

const unwrapData = <T>(payload: any): T => {
  return payload?.data !== undefined ? payload.data : payload;
};

export const getAllCities = async (): Promise<string[]> => {
  const res = await api.get(`${basePath}/cities`);
  return unwrapData<string[]>(res.data);
};

export const getDistrictsByCity = async (
  city: string,
): Promise<DistrictInfo[]> => {
  const res = await api.get(`${basePath}/districts/${encodeURIComponent(city)}`);
  return unwrapData<DistrictInfo[]>(res.data);
};
