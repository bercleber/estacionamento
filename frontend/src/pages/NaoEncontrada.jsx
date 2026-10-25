import { Link } from 'react-router';

export default function NaoEncontrada() {
  return (
    <section aria-labelledby="titulo-nao-encontrada">
      <h1 id="titulo-nao-encontrada" className="text-2xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="mt-2 text-slate-600">O endereço informado não corresponde a uma página.</p>
      <Link to="/" className="mt-5 inline-block font-medium text-primary underline underline-offset-4">
        Voltar ao início
      </Link>
    </section>
  );
}
