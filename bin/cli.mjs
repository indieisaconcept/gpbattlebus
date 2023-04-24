#!/usr/bin/env node
import meow from "meow";
import cmd from "../lib/index.mjs";
import { log } from "../lib/util/common.mjs";

const cli = meow(
  `
    Usage
        $ gbbattlebus --profile <username>

    Options
        --profile     -p  The credentials profile to use
        --credentials -c  The location where credentials are stored
        --limit       -l  Limit the number of friends to add at a time
        --dryrun      -d  Perform a dry run
        --reference   -r  The google sheet id to use as a friend source

    Examples
        $  gbbattlebus --profile indieisaconcept --dryrun
`,
  {
    importMeta: import.meta,
    flags: {
      dryrun: {
        type: "boolean",
        default: false,
        shortFlag: "d",
      },
      credentials: {
        type: "string",
        default: "./deviceAuth.json",
        helpText: "Defaults to ./deviceAuth.json if not supplied",
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
      profile: {
        type: "string",
        shortFlag: "p",
      },
    },
  }
);

if (!cli.flags.profile || !cli.flags.reference) {
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
  await cmd({
    ...cli.flags,
    clientCode: "3446cd72694c4a4485d81b77adbb2141",
    googleSheetId: cli.flags.reference,
  });
}

process.exit(0);
