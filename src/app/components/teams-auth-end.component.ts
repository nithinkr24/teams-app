import { Component, OnInit, OnDestroy } from '@angular/core';

import { app, authentication } from '@microsoft/teams-js';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'teams-auth-end',
    template: '',
    animations: []
})
export class TeamsAuthEndComponent implements OnInit, OnDestroy {

    constructor(
        private route: ActivatedRoute,
    ) { }

    ngOnInit(): void {
        app.initialize().then(() => {
            this.route.queryParams.subscribe(params => {
                const token = params['teamsreturntoken'];

                if (token && token !== 'null') {
                    authentication.notifySuccess(
                        JSON.stringify({
                            jenneToken: token,
                        })
                    )
                } else {
                    authentication.notifyFailure("Token not found or is null");
                }
            });
        }).catch(err => {
            console.error("Teams SDK initialization failed", err);
            authentication.notifyFailure("SDK Initialization Failed");
        });
    }

    ngOnDestroy(): void {
    }
}
