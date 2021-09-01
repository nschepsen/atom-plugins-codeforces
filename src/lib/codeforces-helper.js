"use babel";

/******************************************************************************/
/*                                                                            */
/* ID: Codeforces!HELPER                                                      */
/* Version: 0.1.0                                                             */
/* Author: nschepsen <git@schepsen.eu>                                        */
/* License: MIT                                                               */
/* Git: https://github.com/nschepsen/codeforces-helper.git                    */
/*                                                                            */
/******************************************************************************/

import { CompositeDisposable } from "atom";
import packageConfig from "./config-schema.json";

const Level =
{
    SUCCESS: 0, INFO: 1, WARNING: 2, ERROR: 3
};

export default
{
    subscriptions: null,
    config: packageConfig,
    delimiter: "/",
    path: "",
    task: "",
    contest: "",
    extension: "",
    extensions: [".cpp", ".cc"],

    activate(state)
    {
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add
        (
            atom.commands.add
            (
                "atom-workspace", { "codeforces-helper:download": () => this.download() }
            )
        );
    },

    deactivate()
    {
        this.subscriptions.dispose();
    },

    serialize()
    {
        return null;
    },

    notify(message, level)
    {
        let msg = "[" + new Date().toISOString().split("T")[1].split(".")[0] + "] " + message;

        switch (level)
        {
            case Level.INFO:
                atom.notifications.addInfo(msg);
                break;
            case Level.WARNING:
                atom.notifications.addWarning(msg);
                break;
            case Level.ERROR:
                atom.notifications.addError(msg);
                break;
            default:
                atom.notifications.addSuccess(msg);
        }
    },

    getSelectedtTaskInformation()
    {
        let path = atom.workspace.getActivePaneItem().selectedPaths().toString().split(this.delimiter);

        this.contest = path[path.length - 2];

        let filename = path.pop(), pos = filename.indexOf(".");

        this.task = filename.substring(0, pos);
        this.extension = filename.substring(pos);

        this.path = path.join(this.delimiter);
    },

    download()
    {
        this.getSelectedtTaskInformation();

        if(!this.extensions.includes(this.extension))
        {
            this.notify
            (
                "The filename extension doesn't match the expected file format.", Level.ERROR
            );

            return;
        }

        if(!new RegExp("^[0-9]{3}$").test(this.contest))
        {
            this.notify
            (
                "The folder containing the selected file doesn't match the pattern.", Level.ERROR
            );

            return;
        }

        const client = new XMLHttpRequest();

        client.onreadystatechange = function()
        {
            if(client.status === 200)
            {
                let src = new DOMParser().parseFromString(client.response, "text/html").getElementsByTagName("pre");

                let fs = require("fs");

                for(i = 0; i < src.length; ++i)
                {
                    fs.writeFile
                    (
                        this.path + "/" + this.task + "." + ((i >> 1) + 1) + "." + ((i & 1) ? "out" : "in"),
                        src[i].innerHTML.replace(new RegExp("<br>", "g"), "\n"),
                        function(error)
                        {
                            if(error)
                            {
                                return this.notify(error, Level.ERROR);
                            }
                        }
                    );

                    if(i == src.length - 1)
                    {
                        this.notify
                        (
                            "Fetched " + ((i >> 1) + 1) + " TC(s) for the task " + this.contest + "-" + this.task
                        );
                    }
                }
            }
        }.bind(this);

        client.open("GET", `http://codeforces.com/contest/${parseInt(this.contest)}/problem/${this.task}`); client.send();
    }
};
