#!/usr/bin/env node
import meow from "meow";
import cmd from "../lib/index.mjs";
import { log } from "../lib/util/common.mjs";

const PUBLIC_ENV = "PUBLIC_ENV" in process.env;

const cli = meow(
  `
    Usage
        $ gpbattlebus --reference "<google-sheet-id>"

    Options
        --reference       -r  The friend source to use

        --profile         -p  Credentials profile to use
        --save-profile    -s  Save auth credentials against profile name
        --credentials     -c  The location where credentials are stored

        --limit           -l  Limit the number of friends to add at a time
        --dryrun          -d  Perform a dry run

    Examples
        $  gpbattlebus --reference <google-sheet-id> --dryrun
`,
  {
    importMeta: import.meta,
    allowUnknownFlags: false,
    flags: {
      dryrun: {
        type: "boolean",
        default: false,
        shortFlag: "d",
      },
      credentials: {
        type: "string",
        default: "./deviceAuth.json",
        shortFlag: "d",
      },
      reference: {
        type: "string",
        shortFlag: "r",
      },
      limit: {
        type: "number",
        default: -1,
        shortFlag: "l",
      },
      saveProfile: {
        type: "boolean",
        shortFlag: "s",
        isRequired: (flags) => (flags.profile ? true : false),
      },
      profile: {
        type: "string",
        shortFlag: "p",
        isRequired: (flags) => (flags.saveProfile ? true : false),
      },
    },
  }
);

if (!cli.flags.reference) {
  log(
    `
██████╗ ███████╗████████╗██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗     
██╔════╝ ██╔════╝╚══██╔══╝██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗    
██║  ███╗█████╗     ██║   ██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██║  ██║    
██║   ██║██╔══╝     ██║   ██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██║  ██║    
╚██████╔╝███████╗   ██║   ██║     ███████╗██║  ██║   ██║   ███████╗██████╔╝    
    ╚═════╝ ╚══════╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝     
                                                                                
██████╗  █████╗ ████████╗████████╗██╗     ███████╗    ██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗╚══██╔══╝╚══██╔══╝██║     ██╔════╝    ██╔══██╗██║   ██║██╔════╝
██████╔╝███████║   ██║      ██║   ██║     █████╗      ██████╔╝██║   ██║███████╗
██╔══██╗██╔══██║   ██║      ██║   ██║     ██╔══╝      ██╔══██╗██║   ██║╚════██║
██████╔╝██║  ██║   ██║      ██║   ███████╗███████╗    ██████╔╝╚██████╔╝███████║
╚═════╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚══════╝╚══════╝    ╚═════╝  ╚═════╝ ╚══════╝`
  );
  cli.showHelp();
} else {
  if (PUBLIC_ENV) {
    log.newLine();
    log("# PUBLIC ENVIRONMENT DETECTED PROFILE USE IS DISABLED");
  }

  await cmd({
    ...cli.flags,
    clientCode: "3446cd72694c4a4485d81b77adbb2141",
    profile: PUBLIC_ENV ? undefined : cli.flags.profile,
    persistAuth: PUBLIC_ENV ? false : cli.flags.saveProfile,
  });
}

process.exit(0);
