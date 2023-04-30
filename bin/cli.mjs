#!/usr/bin/env node
import meow from "meow";
import cmd from "../lib/index.mjs";
import { log } from "../lib/util/common.mjs";

const IS_REPL = "REPL_ID" in process.env; // Is this running on REPL?

const cli = meow(
  `
    Usage
        $ gpbattlebus --reference "<google-sheet-id>"

    Options
        --reference       -r  The friend source to use
        --mode            -m  The execution mode "auto", "add", "accept"

        --profile         -p  Authentication profile to use
        --save-profile    -s  Save authentication tokens against profile name
        --credentials     -c  The location where credentials are stored

        --limit           -l  Limit the number of friends to add at a time
        --dryrun          -d  Perform a dry run

    Examples
        $  gpbattlebus --reference <google-sheet-id> --mode add --dryrun
        $  gpbattlebus --reference <google-sheet-id> --mode accept --dryrun
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
      mode: {
        type: "string",
        choices: ["auto", "add", "accept", "summary"],
        default: "summary",
        shortFlag: "mode",
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
  if (IS_REPL) {
    log.newLine();
    log("# PUBLIC ENVIRONMENT DETECTED PROFILE USE IS DISABLED");
  }

  await cmd({
    ...cli.flags,
    clientCode: "3446cd72694c4a4485d81b77adbb2141",
    profile: IS_REPL ? undefined : cli.flags.profile,
    persistAuth: IS_REPL ? false : cli.flags.saveProfile,
  });
}

process.exit(0);
