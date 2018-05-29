'use babel';

import { CompositeDisposable } from 'atom';

export default
{
    subscriptions: null,

    activate(state)
    {
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add
        (
            atom.commands.add
            (
                'atom-workspace', { 'codeforces-helper:download': () => this.download() }
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

    download()
    {
        var path = atom.workspace.getActivePaneItem().selectedPaths().toString().split('/');
        var task = path.pop(), contest = path.pop();

        path.push(contest);

        path = path.join("/");

        if(task.substr(-3) != "cpp")
        {
            console.log
            (
                "The file name extension doesn't match the expected file format."
            );

            return null;
        }

        task = task.slice(0, -4);

        if(!new RegExp("^[0-9]{3}$").test(contest))
        {
            console.log
            (
                "The folder containing the selected file doesn't match the pattern."
            );

            return null;
        }

        var client = new XMLHttpRequest();

        client.onreadystatechange = function()
        {
            if(client.status === 200)
            {
                var src = new DOMParser().parseFromString(client.response, "text/html").getElementsByTagName("pre");

                var fs = require('fs');

                var newlineRE = new RegExp("<br>", "g");

                for(i = 0; i < src.length; ++i)
                {
                    fs.writeFile
                    (
                        path + "/" + task + "." + ((i >> 1) + 1) + ((i & 1) ? ".out" : ".in"),
                        src[i].innerHTML.replace(newlineRE, "\n"), function()
                        {
                            console.log();
                        }
                    );
                }
            }
        }

        client.open
        (
            "GET",

            "http://codeforces.com/contest/" + parseInt(contest, 10) + "/problem/" + task
        );

        client.send(); return null;
    }
};
