import { Component, OnInit, OnDestroy } from '@angular/core';
import { Web3Service } from "../../web3/web3.service";
import { MatSnackBar } from '@angular/material';
import { Subscription } from "rxjs";

@Component({
  selector: 'app-agreement-list',
  templateUrl: './agreement-list.component.html',
  styleUrls: ['./agreement-list.component.css']
})

export class AgreementListComponent implements OnInit, OnDestroy {

  private Factory: Promise<any>;
  private filter: any;
  private agreements: string[];
  private accounts : string[];
  private account: string;
  private subscription: Subscription;

  constructor(private web3Service : Web3Service, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.setFactory();
    this.watchAccount();
    this.watchAgreementEvents();
  }

  ngOnDestroy() {
    this.filter.stopWatching((error, result) => {
      if (error == null) {
        console.log("stopped watching");
      }
    });
    this.subscription.unsubscribe();
  }

  setFactory() {
    this.Factory = new Promise((resolve, reject) => {
      setInterval(() => {
        if (this.web3Service.ready) {
          resolve(this.web3Service.FlexiTimeFactory);
        }
      }, 100)
    });
  }

  setAgreements() {
    this.Factory.then((contract) => {
      return contract.deployed();
    }).then((factoryInstance) => {
      return factoryInstance.getAgreements.call();
    }).then((agreements) => {
      this.agreements = agreements;
    }).catch(function (e) {
      console.log(e);
    });
  }

  watchAgreementEvents() {
    this.Factory.then((contract) => {
      return contract.deployed();
    }).then ((factoryInstance) => {
      return factoryInstance.Agreement({fromBlock: "latest"});
    }).then ((agreements) => {
      agreements.watch((error, result) => {
        if (error == null) {
          this.snackBar.open("Agreement " + result.args.agreement + " created.", "Dismiss", { duration: 2000 });
          this.setAgreements();
        }
      });
      this.filter = agreements;
    });
  }

  watchAccount() {
    this.subscription = this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.account = accounts[0];
      this.setAgreements(); // update agreements array in case user swtiches to a different account
    });
  }

}