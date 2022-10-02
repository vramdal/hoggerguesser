import React, { useCallback, useEffect } from "react";
import { httpFetch } from "./browser";
// import { buildTimestamp as codeBuildTimestamp} from "./timestamp";


export const useIsWebappOutdated : () => [boolean, () => Promise<boolean>] = () => {
  const [timestamp, setTimestamp] = React.useState<string | undefined>(undefined);
  const [isOutdated, setIsOutdated] = React.useState(false);

  const checkIsOutdated : () => Promise<boolean> = useCallback(() => {
    return httpFetch("/hvor-i-vazelina/timestamp.json", {cache: "reload"}).then(response => response.json()).then(timestampWrapper => {
      const newTimestamp = timestampWrapper.timestamp;
      const isOutdated = timestamp !== undefined && newTimestamp !== timestamp;
      setTimestamp(newTimestamp);
      return isOutdated;
    });
  }, [setTimestamp]);

  useEffect(() => {
    checkIsOutdated().then(setIsOutdated);
  }, [checkIsOutdated]);

  return [isOutdated, checkIsOutdated];
};

