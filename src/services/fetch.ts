import Constants from "expo-constants";
import { API_LINK } from "../constants";
import { logger } from "../utils/logger";

const HOST = Constants.expoConfig?.extra?.HOST || "";
if(HOST === ""){
  console.error("unable to get HOST name")
}
interface fetchResponseModel {
  response: Record<string,any>
  data?: Record<string,any>
}
export const fetchAPI: (a: {
  link: API_LINK;
  method: "POST" | "GET" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, any>; //without JSON.stringify()
}) => Promise< fetchResponseModel | undefined> = async ({
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
    if (response.ok) {
      const data = await response.json();
      return {
        response,
        data
      };
    }else{
      logger.error(`Not OK responce for link:${link} status: ${response.status} statusTest: ${response.statusText}`)
      return { response };
    }
  } catch (error) {
    logger.error("Failed to fetch from API. Error:" + error);
  }

  return undefined;
};
