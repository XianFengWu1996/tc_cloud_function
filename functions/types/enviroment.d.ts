export {}

declare global {
    namespace NodeJS {
      interface ProcessEnv {
        STORE_ID: string,
        ADMIN: string, // it will be treated as a string, we need to split it 
        FULLDAY_MENUID: string,
        LUNCH_MENUID:string,
        SPECIAL_MENUID: string,
        SPECIAL_CATEGORYID: string
      }
    }
  }
  