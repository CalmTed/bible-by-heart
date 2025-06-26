import Constants from "expo-constants";
import { API_LINK } from "src/constants";
import { logger } from "src/utils/logger";

const HOST = Constants.expoConfig?.extra?.HOST || "";

export const fetchAPI: (a: {
  link: API_LINK;
  method: "POST" | "GET" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, any>; //after JSON.stringify()
}) => Promise<Record<string, string> | undefined> = async ({
  link,
  method,
  headers,
  body
}) => {
  try {
    const response = await fetch(HOST + link, {
      method: method,
      headers: headers,
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (response.ok) {
      return data;
    }
  } catch (error) {
    logger.error("Failed to fetch from API. Error:" + error);
  }

  return undefined;
};
