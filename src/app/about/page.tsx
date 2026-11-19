
import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  Users,
  Star,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: Heart,
    title: "Customer First",
    description:
      "Our customers are at the heart of everything we do. We work hard to provide an enjoyable shopping experience.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Products",
    description:
      "We carefully select products to provide quality, value, and reliability with every purchase.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "We aim to deliver your orders safely and quickly, right to your doorstep.",
  },
  {
    icon: Star,
    title: "Great Experience",
    description:
      "From browsing to checkout, we want every step of your shopping journey to be simple.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gray-50 px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            About Our Store
          </span>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            Shopping Made
            <span className="text-blue-600"> Simple.</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Welcome to our store! We believe shopping should be easy,
            enjoyable, and accessible to everyone. Discover products
            you love at prices you'll appreciate.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Explore Our Shop
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Our Story */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <span className="font-semibold uppercase tracking-widest text-blue-600 text-sm">
            Our Story
          </span>

          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            More Than Just an Online Store
          </h2>

          <p className="mt-6 leading-7 text-gray-600">
            We started with a simple idea: make online shopping
            convenient and accessible for everyone.
          </p>

          <p className="mt-4 leading-7 text-gray-600">
            Our goal is to bring together products that people need
            and love, while providing a smooth and trustworthy
            shopping experience.
          </p>

          <p className="mt-4 leading-7 text-gray-600">
            Whether you're looking for everyday essentials or
            something special, we're here to help you find it.
          </p>
        </div>

        <div className="flex min-h-80 items-center justify-center rounded-2xl bg-blue-50 p-10">
          <div className="text-center">
            <ShoppingBag
              size={100}
              className="mx-auto text-blue-600"
              strokeWidth={1.2}
            />
            <h3 className="mt-6 text-2xl font-bold text-gray-900">
              Your Shopping Destination
            </h3>
            <p className="mt-2 text-gray-600">
              Everything you need, all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              What We Believe
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Our Core Values
            </h2>
            <p className="mt-4 text-gray-600">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="rounded-xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="text-blue-600" size={25} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Ready to Start Shopping?
        </h2>

        <p className="mt-4 text-gray-600">
          Explore our collection and find something you'll love.
        </p>

        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Shop Now
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
