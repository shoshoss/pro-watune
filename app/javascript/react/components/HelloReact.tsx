type Props = { name: string };

export default function HelloReact({ name }: Props) {
  return <p className="p-4 text-lg font-semibold">Hello from React, {name}</p>;
}
