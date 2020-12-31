import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

import { throwError } from 'rxjs';
import { retry, catchError, delay, tap } from 'rxjs/operators';

import { Product } from './product';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    
    private REST_API_SERVER = "https://localhost:5001/api/products";    

    public first: string = "";
    public prev: string = "";
    public next: string = "";
    public last: string = "";

    constructor(private httpClient: HttpClient) { }

    parseLinkHeader(header: string) {
        if(header.length == 0) {
            return;
        }

        let parts = header.split(',');
        
        type ObjLinks = {
            [key: string]: string
        };
        
        var links: ObjLinks = {};

        parts.forEach( p => {
            let section = p.split(';');
            var url = section[0].replace(/<(.*)>/, '$1').trim();
            var name = section[1].replace(/rel="(.*)"/, '$1').trim();
            links[name] = url;
        });

        this.first = links["first"];
        this.last = links["last"];
        this.prev = links["prev"];
        this.next = links["next"];
    }

    handleError(error: HttpErrorResponse) {
        let errorMessage = 'Unknown error!';
        if(error.error instanceof ErrorEvent) {
            //Client-side errors
            errorMessage = `Error: ${error.error.message}`;
        } else {
            //Server-side errors
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        window.alert(errorMessage);
        return throwError(errorMessage);
    }

    public sendGetRequest() {
        //Add safe, URL encoded_page parameter
        return this.httpClient
            .get<Product[]>(this.REST_API_SERVER, {
                params: new HttpParams({fromString: "_page=1&_limit=3"}), 
                observe: "response"})
            .pipe(delay(5000))
            .pipe(retry(3), catchError(this.handleError), tap(res => {
               console.log(res.headers.get('Link'));
               this.parseLinkHeader(res.headers.get('Link') || '{}');
            }));
    }

    public sendGetRequestToUrl(url: string) {
        return this.httpClient
            .get<Product[]>(url, { observe: "response"})
            .pipe(delay(3000))
            .pipe(retry(3), catchError(this.handleError), tap(res => {
                console.log(res.headers.get('Link'));
                this.parseLinkHeader(res.headers.get('Link') || '{}');
            }));
    }
}