class Input{
  button: HTMLElement;
  input: HTMLInputElement;
  clicked?: () => void;

  constructor( id: string ){
    this.button = document.querySelector<HTMLElement>('#'+id)!;
    this.input = document.querySelector<HTMLInputElement>('#'+id+'-input')!;

    this.button.onclick = () => {
      if(this.clicked)
        this.clicked();
    }

    this.input.onkeyup = ( e: KeyboardEvent ) => {
      if(e.key === 'Enter' && this.clicked)
        this.clicked();
    }
  }
}

export { Input };